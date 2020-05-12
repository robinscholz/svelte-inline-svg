function noop() { }
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function set_svg_attributes(node, attributes) {
    for (const key in attributes) {
        attr(node, key, attributes[key]);
    }
}
function children(element) {
    return Array.from(element.childNodes);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}
const outroing = new Set();
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}

function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = { $$scope: 1 };
    let i = levels.length;
    while (i--) {
        const o = levels[i];
        const n = updates[i];
        if (n) {
            for (const key in o) {
                if (!(key in n))
                    to_null_out[key] = 1;
            }
            for (const key in n) {
                if (!accounted_for[key]) {
                    update[key] = n[key];
                    accounted_for[key] = 1;
                }
            }
            levels[i] = n;
        }
        else {
            for (const key in o) {
                accounted_for[key] = 1;
            }
        }
    }
    for (const key in to_null_out) {
        if (!(key in update))
            update[key] = undefined;
    }
    return update;
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if ($$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set() {
        // overridden by instance, if it has props
    }
}

/* src/inline-svg.svelte generated by Svelte v3.22.2 */

function create_fragment(ctx) {
	let svg;
	let dispose;

	let svg_levels = [
		{ xmlmns: "http://www.w3.org/2000/svg" },
		/*svgAttrs*/ ctx[1],
		/*attributes*/ ctx[0],
		{ contenteditable: "true" }
	];

	let svg_data = {};

	for (let i = 0; i < svg_levels.length; i += 1) {
		svg_data = assign(svg_data, svg_levels[i]);
	}

	return {
		c() {
			svg = svg_element("svg");
			set_svg_attributes(svg, svg_data);
			if (/*svgContent*/ ctx[2] === void 0) add_render_callback(() => /*svg_input_handler*/ ctx[10].call(svg));
		},
		m(target, anchor, remount) {
			insert(target, svg, anchor);

			if (/*svgContent*/ ctx[2] !== void 0) {
				svg.innerHTML = /*svgContent*/ ctx[2];
			}

			if (remount) dispose();
			dispose = listen(svg, "input", /*svg_input_handler*/ ctx[10]);
		},
		p(ctx, [dirty]) {
			set_svg_attributes(svg, get_spread_update(svg_levels, [
				{ xmlmns: "http://www.w3.org/2000/svg" },
				dirty & /*svgAttrs*/ 2 && /*svgAttrs*/ ctx[1],
				dirty & /*attributes*/ 1 && /*attributes*/ ctx[0],
				{ contenteditable: "true" }
			]));

			if (dirty & /*svgContent*/ 4 && /*svgContent*/ ctx[2] !== svg.innerHTML) {
				svg.innerHTML = /*svgContent*/ ctx[2];
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(svg);
			dispose();
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { src } = $$props;
	let { transformSrc = svg => svg } = $$props;
	let { attributes } = $$props;

	onMount(() => {
		inline(src);
		console.log(src);
	});

	let cache = {};
	let isLoaded = false;
	let svgAttrs = {};
	let svgContent;

	function download(url) {
		return new Promise((resolve, reject) => {
				const request = new XMLHttpRequest();
				request.open("GET", url, true);

				request.onload = () => {
					if (request.status >= 200 && request.status < 400) {
						try {
							// Setup a parser to convert the response to text/xml in order for it to be manipulated and changed
							const parser = new DOMParser();

							const result = parser.parseFromString(request.responseText, "text/xml");
							let svgEl = result.getElementsByTagName("svg")[0];

							if (svgEl) {
								// Apply transformation
								svgEl = transformSrc(svgEl);

								resolve(svgEl);
							} else {
								reject(new Error("Loaded file is not valid SVG\""));
							}
						} catch(error) {
							reject(error);
						}
					} else {
						reject(new Error("Error loading SVG"));
					}
				};

				request.onerror = reject;
				request.send();
			});
	}

	function inline(src) {
		// fill cache by src with promise
		if (!cache[src]) {
			// notify svg is unloaded
			if (isLoaded) {
				isLoaded = false;
				dispatch("unloaded");
			} // this.$emit('unloaded');

			// download
			cache[src] = download(src);
		}

		// inline svg when cached promise resolves
		cache[src].then(svg => {
			// copy attrs
			const attrs = svg.attributes;

			for (let i = attrs.length - 1; i >= 0; i--) {
				$$invalidate(1, svgAttrs[attrs[i].name] = attrs[i].value, svgAttrs);
			}

			// copy inner html
			$$invalidate(2, svgContent = svg.innerHTML);

			// render svg element
			isLoaded = true;

			dispatch("loaded");
		}).catch(error => {
			// remove cached rejected promise so next image can try load again
			delete cache[src];

			console.error(error);
		});
	}

	function svg_input_handler() {
		svgContent = this.innerHTML;
		$$invalidate(2, svgContent);
	}

	$$self.$set = $$props => {
		if ("src" in $$props) $$invalidate(3, src = $$props.src);
		if ("transformSrc" in $$props) $$invalidate(4, transformSrc = $$props.transformSrc);
		if ("attributes" in $$props) $$invalidate(0, attributes = $$props.attributes);
	};

	return [
		attributes,
		svgAttrs,
		svgContent,
		src,
		transformSrc,
		cache,
		isLoaded,
		dispatch,
		download,
		inline,
		svg_input_handler
	];
}

class Inline_svg extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { src: 3, transformSrc: 4, attributes: 0 });
	}
}

export default Inline_svg;
