function e(e,t,i,o){var r,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,i):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,o);else for(var n=e.length-1;n>=0;n--)(r=e[n])&&(a=(s<3?r(a):s>3?r(t,i,a):r(t,i))||a);return s>3&&a&&Object.defineProperty(t,i,a),a}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),r=new WeakMap;let s=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=r.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&r.set(t,e))}return e}toString(){return this.cssText}};const a=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[o+1],e[0]);return new s(i,e,o)},n=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:c,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:p,getOwnPropertySymbols:h,getPrototypeOf:g}=Object,u=globalThis,m=u.trustedTypes,v=m?m.emptyScript:"",_=u.reactiveElementPolyfillSupport,f=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?v:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},x=(e,t)=>!c(e,t),y={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:x};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=y){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),o=this.getPropertyDescriptor(e,i,t);void 0!==o&&l(this.prototype,e,o)}}static getPropertyDescriptor(e,t,i){const{get:o,set:r}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const s=o?.call(this);r?.call(this,t),this.requestUpdate(e,s,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??y}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=g(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...p(e),...h(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(i)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of o){const o=document.createElement("style"),r=t.litNonce;void 0!==r&&o.setAttribute("nonce",r),o.textContent=i.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,i);if(void 0!==o&&!0===i.reflect){const r=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==r?this.removeAttribute(o):this.setAttribute(o,r),this._$Em=null}}_$AK(e,t){const i=this.constructor,o=i._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=i.getPropertyOptions(o),r="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=o;const s=r.fromAttribute(t,e.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(e,t,i,o=!1,r){if(void 0!==e){const s=this.constructor;if(!1===o&&(r=this[e]),i??=s.getPropertyOptions(e),!((i.hasChanged??x)(r,t)||i.useDefault&&i.reflect&&r===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:o,wrapped:r},s){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==r||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,i,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,_?.({ReactiveElement:$}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k=globalThis,w=e=>e,S=k.trustedTypes,T=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,A="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+E,I=`<${C}>`,z=document,P=()=>z.createComment(""),U=e=>null===e||"object"!=typeof e&&"function"!=typeof e,R=Array.isArray,M="[ \t\n\f\r]",O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,L=/-->/g,N=/>/g,B=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),D=/'/g,j=/"/g,H=/^(?:script|style|textarea|title)$/i,F=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),q=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),G=new WeakMap,Y=z.createTreeWalker(z,129);function V(e,t){if(!R(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==T?T.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,o=[];let r,s=2===t?"<svg>":3===t?"<math>":"",a=O;for(let t=0;t<i;t++){const i=e[t];let n,c,l=-1,d=0;for(;d<i.length&&(a.lastIndex=d,c=a.exec(i),null!==c);)d=a.lastIndex,a===O?"!--"===c[1]?a=L:void 0!==c[1]?a=N:void 0!==c[2]?(H.test(c[2])&&(r=RegExp("</"+c[2],"g")),a=B):void 0!==c[3]&&(a=B):a===B?">"===c[0]?(a=r??O,l=-1):void 0===c[1]?l=-2:(l=a.lastIndex-c[2].length,n=c[1],a=void 0===c[3]?B:'"'===c[3]?j:D):a===j||a===D?a=B:a===L||a===N?a=O:(a=B,r=void 0);const p=a===B&&e[t+1].startsWith("/>")?" ":"";s+=a===O?i+I:l>=0?(o.push(n),i.slice(0,l)+A+i.slice(l)+E+p):i+E+(-2===l?t:p)}return[V(e,s+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class K{constructor({strings:e,_$litType$:t},i){let o;this.parts=[];let r=0,s=0;const a=e.length-1,n=this.parts,[c,l]=J(e,t);if(this.el=K.createElement(c,i),Y.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=Y.nextNode())&&n.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(A)){const t=l[s++],i=o.getAttribute(e).split(E),a=/([.?@])?(.*)/.exec(t);n.push({type:1,index:r,name:a[2],strings:i,ctor:"."===a[1]?te:"?"===a[1]?ie:"@"===a[1]?oe:ee}),o.removeAttribute(e)}else e.startsWith(E)&&(n.push({type:6,index:r}),o.removeAttribute(e));if(H.test(o.tagName)){const e=o.textContent.split(E),t=e.length-1;if(t>0){o.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)o.append(e[i],P()),Y.nextNode(),n.push({type:2,index:++r});o.append(e[t],P())}}}else if(8===o.nodeType)if(o.data===C)n.push({type:2,index:r});else{let e=-1;for(;-1!==(e=o.data.indexOf(E,e+1));)n.push({type:7,index:r}),e+=E.length-1}r++}}static createElement(e,t){const i=z.createElement("template");return i.innerHTML=e,i}}function Z(e,t,i=e,o){if(t===q)return t;let r=void 0!==o?i._$Co?.[o]:i._$Cl;const s=U(t)?void 0:t._$litDirective$;return r?.constructor!==s&&(r?._$AO?.(!1),void 0===s?r=void 0:(r=new s(e),r._$AT(e,i,o)),void 0!==o?(i._$Co??=[])[o]=r:i._$Cl=r),void 0!==r&&(t=Z(e,r._$AS(e,t.values),r,o)),t}class Q{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,o=(e?.creationScope??z).importNode(t,!0);Y.currentNode=o;let r=Y.nextNode(),s=0,a=0,n=i[0];for(;void 0!==n;){if(s===n.index){let t;2===n.type?t=new X(r,r.nextSibling,this,e):1===n.type?t=new n.ctor(r,n.name,n.strings,this,e):6===n.type&&(t=new re(r,this,e)),this._$AV.push(t),n=i[++a]}s!==n?.index&&(r=Y.nextNode(),s++)}return Y.currentNode=z,o}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,o){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),U(e)?e===W||null==e||""===e?(this._$AH!==W&&this._$AR(),this._$AH=W):e!==this._$AH&&e!==q&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>R(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==W&&U(this._$AH)?this._$AA.nextSibling.data=e:this.T(z.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,o="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=K.createElement(V(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new Q(o,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=G.get(e.strings);return void 0===t&&G.set(e.strings,t=new K(e)),t}k(e){R(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,o=0;for(const r of e)o===t.length?t.push(i=new X(this.O(P()),this.O(P()),this,this.options)):i=t[o],i._$AI(r),o++;o<t.length&&(this._$AR(i&&i._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=w(e).nextSibling;w(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,o,r){this.type=1,this._$AH=W,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=r,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(e,t=this,i,o){const r=this.strings;let s=!1;if(void 0===r)e=Z(this,e,t,0),s=!U(e)||e!==this._$AH&&e!==q,s&&(this._$AH=e);else{const o=e;let a,n;for(e=r[0],a=0;a<r.length-1;a++)n=Z(this,o[i+a],t,a),n===q&&(n=this._$AH[a]),s||=!U(n)||n!==this._$AH[a],n===W?e=W:e!==W&&(e+=(n??"")+r[a+1]),this._$AH[a]=n}s&&!o&&this.j(e)}j(e){e===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===W?void 0:e}}class ie extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==W)}}class oe extends ee{constructor(e,t,i,o,r){super(e,t,i,o,r),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??W)===q)return;const i=this._$AH,o=e===W&&i!==W||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,r=e!==W&&(i===W||o);o&&this.element.removeEventListener(this.name,this,i),r&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class re{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}}const se=k.litHtmlPolyfillSupport;se?.(K,X),(k.litHtmlVersions??=[]).push("3.3.2");const ae=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class ne extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const o=i?.renderBefore??t;let r=o._$litPart$;if(void 0===r){const e=i?.renderBefore??null;o._$litPart$=r=new X(t.insertBefore(P(),e),e,void 0,i??{})}return r._$AI(e),r})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}ne._$litElement$=!0,ne.finalized=!0,ae.litElementHydrateSupport?.({LitElement:ne});const ce=ae.litElementPolyfillSupport;ce?.({LitElement:ne}),(ae.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const le=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},de={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:x},pe=(e=de,t,i)=>{const{kind:o,metadata:r}=i;let s=globalThis.litPropertyMetadata.get(r);if(void 0===s&&globalThis.litPropertyMetadata.set(r,s=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),s.set(i.name,e),"accessor"===o){const{name:o}=i;return{set(i){const r=t.get.call(this);t.set.call(this,i),this.requestUpdate(o,r,e,!0,i)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=i;return function(i){const r=this[o];t.call(this,i),this.requestUpdate(o,r,e,!0,i)}}throw Error("Unsupported decorator location: "+o)};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function he(e){return(t,i)=>"object"==typeof i?pe(e,t,i):((e,t,i)=>{const o=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),o?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function ge(e){return he({...e,state:!0,attribute:!1})}function ue(e){if(!e)return"";const t=e.match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/);if(!t)return"";const i=parseInt(t[1]||"0",10),o=parseInt(t[2]||"0",10);return i&&o?`${i}h ${o}m`:i?`${i}h`:o?`${o}m`:""}function me(e){if(!e)return"never";const t=new Date(e).getTime();if(isNaN(t))return"never";const i=(Date.now()-t)/1e3;return i<60?"just now":i<3600?`${Math.floor(i/60)}m ago`:i<86400?`${Math.floor(i/3600)}h ago`:i<604800?`${Math.floor(i/86400)}d ago`:i<2592e3?`${Math.floor(i/604800)}w ago`:i<31536e3?`${Math.floor(i/2592e3)}mo ago`:`${Math.floor(i/31536e3)}y ago`}function ve(e){if(!e)return null;const t=/^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(e);if(!t)return null;return 60*parseInt(t[1]||"0",10)+parseInt(t[2]||"0",10)}let _e=class extends ne{constructor(){super(...arguments),this.recipes=[],this.columns=3,this.showFilters=!1,this.groupBy="none",this._search="",this._activeTags=new Set,this._activeChips=new Set,this._sortBy="name",this._viewMode="grid"}connectedCallback(){super.connectedCallback();const e=localStorage.getItem("recipe-box-group-by");e&&["none","tag","category","source"].includes(e)&&(this._groupOverride=e);const t=localStorage.getItem("recipe-box-sort-by");t&&["name","imported","last_cooked","cooked_count","total_time"].includes(t)&&(this._sortBy=t);const i=localStorage.getItem("recipe-box-view-mode");"grid"!==i&&"list"!==i||(this._viewMode=i)}get _activeGroupBy(){return this._groupOverride??this.groupBy}_setGroupBy(e){this._groupOverride=e,localStorage.setItem("recipe-box-group-by",e)}_setSortBy(e){this._sortBy=e,localStorage.setItem("recipe-box-sort-by",e)}_setViewMode(e){this._viewMode=e,localStorage.setItem("recipe-box-view-mode",e)}_toggleChip(e){this._activeChips.has(e)?this._activeChips.delete(e):this._activeChips.add(e),this._activeChips=new Set(this._activeChips)}_selectRecipe(e){this.dispatchEvent(new CustomEvent("recipe-selected",{detail:{slug:e},bubbles:!0,composed:!0}))}_allTags(){const e=new Set;for(const t of this.recipes)for(const i of t.tags)e.add(i);return[...e].sort()}_toggleTag(e){this._activeTags.has(e)?this._activeTags.delete(e):this._activeTags.add(e),this._activeTags=new Set(this._activeTags)}_filtered(){const e=this._search.trim().toLowerCase(),t=Date.now()-12096e5,i=this.recipes.filter(i=>{if(e){const t=i.name.toLowerCase().includes(e),o=(i.ingredients_text||"").toLowerCase().includes(e);if(!t&&!o)return!1}if(this._activeTags.size>0)for(const e of this._activeTags)if(!i.tags.includes(e))return!1;for(const e of this._activeChips){if("never"===e&&i.cooked_count>0)return!1;if("favorite"===e&&i.cooked_count<3)return!1;if("quick"===e){const e=ve(i.totalTime);if(null===e||e>30)return!1}if("recent"===e){if(!i.last_cooked)return!1;if(new Date(i.last_cooked).getTime()<t)return!1}}return!0});return this._sorted(i)}_sorted(e){const t=[...e];switch(this._sortBy){case"imported":t.sort((e,t)=>(t.imported_at??"").localeCompare(e.imported_at??""));break;case"last_cooked":t.sort((e,t)=>e.last_cooked||t.last_cooked?e.last_cooked?t.last_cooked?t.last_cooked.localeCompare(e.last_cooked):-1:1:e.name.localeCompare(t.name));break;case"cooked_count":t.sort((e,t)=>(t.cooked_count||0)-(e.cooked_count||0)||e.name.localeCompare(t.name));break;case"total_time":t.sort((e,t)=>{const i=ve(e.totalTime),o=ve(t.totalTime);return null===i&&null===o?e.name.localeCompare(t.name):null===i?1:null===o?-1:i-o});break;default:t.sort((e,t)=>e.name.localeCompare(t.name))}return t}_cookAgain(){return[...this.recipes].filter(e=>e.cooked_count>0).sort((e,t)=>(t.cooked_count||0)-(e.cooked_count||0)).slice(0,8)}_pickRandom(){const e=this._filtered();if(0===e.length)return;const t=e[Math.floor(Math.random()*e.length)];this._selectRecipe(t.slug)}render(){const e=this._filtered(),t=this._allTags(),i=this._cookAgain();return F`
      <div class="search-row">
        <ha-icon icon="mdi:magnify"></ha-icon>
        <input
          type="search"
          placeholder="Search name or ingredients..."
          .value=${this._search}
          @input=${e=>this._search=e.target.value}
        />
        <button
          class="icon-btn"
          @click=${this._pickRandom}
          title="Pick a random recipe (respects active filters)"
        >
          <ha-icon icon="mdi:dice-multiple"></ha-icon>
        </button>
      </div>

      <div class="toolbar-row">
        <select
          class="toolbar-select"
          .value=${this._sortBy}
          @change=${e=>this._setSortBy(e.target.value)}
          title="Sort by..."
        >
          <option value="name">A → Z</option>
          <option value="imported">Recently added</option>
          <option value="last_cooked">Last cooked</option>
          <option value="cooked_count">Most cooked</option>
          <option value="total_time">Quickest</option>
        </select>
        <select
          class="toolbar-select"
          .value=${this._activeGroupBy}
          @change=${e=>this._setGroupBy(e.target.value)}
          title="Group recipes by..."
        >
          <option value="none">No groups</option>
          <option value="tag">By tag</option>
          <option value="category">By category</option>
          <option value="source">By source</option>
        </select>
        <div class="view-toggle">
          <button
            class=${"grid"===this._viewMode?"active":""}
            @click=${()=>this._setViewMode("grid")}
            title="Grid view"
          >
            <ha-icon icon="mdi:view-grid"></ha-icon>
          </button>
          <button
            class=${"list"===this._viewMode?"active":""}
            @click=${()=>this._setViewMode("list")}
            title="Compact list view"
          >
            <ha-icon icon="mdi:view-list"></ha-icon>
          </button>
        </div>
      </div>

      <div class="chip-row">
        ${this._chipButton("never","mdi:sparkles","Never tried")}
        ${this._chipButton("quick","mdi:lightning-bolt","Quick")}
        ${this._chipButton("recent","mdi:clock-outline","Cooked recently")}
        ${this._chipButton("favorite","mdi:star","Favorites")}
      </div>

      ${this.showFilters&&t.length?F`<div class="tag-row">
            ${t.map(e=>F`<button
                class="tag ${this._activeTags.has(e)?"active":""}"
                @click=${()=>this._toggleTag(e)}
              >
                ${e}
              </button>`)}
          </div>`:W}

      ${i.length>0&&0===this._activeChips.size&&0===this._activeTags.size&&!this._search?F`<div class="cook-again-section">
            <div class="section-header">
              <ha-icon icon="mdi:silverware-fork-knife"></ha-icon>
              <span>Cook again</span>
            </div>
            <div class="cook-again-row">
              ${i.map(e=>this._renderMiniTile(e))}
            </div>
          </div>`:W}

      ${0===e.length?F`<div class="empty">
            ${0===this.recipes.length?F`<p>No recipes yet. Add one to get started.</p>`:F`<p>No recipes match.</p>`}
          </div>`:"none"===this._activeGroupBy?this._renderRecipeContainer(e):this._renderGrouped(e)}
    `}_chipButton(e,t,i){const o=this._activeChips.has(e);return F`
      <button
        class="chip ${o?"active":""}"
        @click=${()=>this._toggleChip(e)}
      >
        <ha-icon icon=${t}></ha-icon> ${i}
      </button>
    `}_renderRecipeContainer(e){return"list"===this._viewMode?F`<div class="recipe-list">
        ${e.map(e=>this._renderListRow(e))}
      </div>`:F`<div class="grid" style="--cols: ${this.columns}">
      ${e.map(e=>this._renderCard(e))}
    </div>`}_renderMiniTile(e){return F`
      <button class="mini-tile" @click=${()=>this._selectRecipe(e.slug)}>
        <div
          class="mini-hero ${e.image?"":"no-image"}"
          style=${e.image?`background-image: url('${e.image}')`:""}
        >
          ${e.image?W:F`<ha-icon icon="mdi:silverware-fork-knife"></ha-icon>`}
        </div>
        <div class="mini-name">${e.name}</div>
        <div class="mini-sub">${e.cooked_count}× cooked</div>
      </button>
    `}_renderListRow(e){const t="pdf"===e.source_type?"mdi:file-pdf-box":"image"===e.source_type?"mdi:image":null;return F`
      <button class="list-row" @click=${()=>this._selectRecipe(e.slug)}>
        <div
          class="list-thumb ${e.image?"":"no-image"}"
          style=${e.image?`background-image: url('${e.image}')`:""}
        >
          ${e.image?W:F`<ha-icon
                icon=${t??"mdi:silverware-fork-knife"}
              ></ha-icon>`}
        </div>
        <div class="list-content">
          <div class="list-name">${e.name}</div>
          <div class="list-sub">
            ${e.totalTime?F`<span><ha-icon icon="mdi:clock-outline"></ha-icon>${ue(e.totalTime)}</span>`:W}
            ${e.cooked_count>0?F`<span><ha-icon icon="mdi:silverware"></ha-icon>${e.cooked_count}×</span>`:W}
            ${e.last_cooked?F`<span title="Last cooked">${me(e.last_cooked)}</span>`:W}
            ${e.tags.length?F`<span class="list-tags">${e.tags.slice(0,2).join(" · ")}</span>`:W}
          </div>
        </div>
        ${t?F`<ha-icon class="list-source" icon=${t}></ha-icon>`:W}
      </button>
    `}_renderGrouped(e){const t=this._buildGroups(e);return F`
      ${t.map(([e,t])=>F`
          <div class="group">
            <div class="group-header">
              <span class="group-name">${e}</span>
              <span class="group-count">${t.length}</span>
            </div>
            ${this._renderRecipeContainer(t)}
          </div>
        `)}
    `}_buildGroups(e){const t=new Map,i=(e,i)=>{t.has(e)||t.set(e,[]),t.get(e).push(i)};for(const t of e)switch(this._activeGroupBy){case"tag":if(0===t.tags.length)i("Untagged",t);else for(const e of t.tags)i(e,t);break;case"category":i(t.recipeCategory?.trim()||"Uncategorized",t);break;case"source":{const e=t.source_type??"web";i("pdf"===e?"PDF":"image"===e?"Photo":"Web",t);break}default:i("All",t)}const o=["Untagged","Uncategorized","Other"];return[...t.entries()].sort(([e],[t])=>{const i=o.includes(e),r=o.includes(t);return i&&!r?1:!i&&r?-1:e.localeCompare(t)})}_renderCard(e){const t="pdf"===e.source_type?"mdi:file-pdf-box":"image"===e.source_type?"mdi:image":null;return F`
      <button class="recipe-tile" @click=${()=>this._selectRecipe(e.slug)}>
        <div
          class="hero ${e.image?"":"no-image"}"
          style=${e.image?`background-image: url('${e.image}')`:""}
        >
          ${e.image?W:F`<ha-icon icon=${t??"mdi:silverware-fork-knife"}></ha-icon>`}
          ${t?F`<span class="source-badge" title=${e.source_type??""}>
                <ha-icon icon=${t}></ha-icon>
              </span>`:W}
        </div>
        <div class="meta">
          <div class="name">${e.name}</div>
          <div class="sub">
            ${e.totalTime?F`<span><ha-icon icon="mdi:clock-outline"></ha-icon>${ue(e.totalTime)}</span>`:W}
            ${e.cooked_count>0?F`<span><ha-icon icon="mdi:silverware"></ha-icon>${e.cooked_count}×</span>`:W}
            ${e.last_cooked?F`<span title="Last cooked">${me(e.last_cooked)}</span>`:W}
          </div>
          ${e.tags.length?F`<div class="tags">
                ${e.tags.slice(0,3).map(e=>F`<span class="tag-chip">${e}</span>`)}
              </div>`:W}
        </div>
      </button>
    `}};_e.styles=a`
    :host {
      display: block;
      font-size: var(--recipe-box-base-font-size, 14px);
      line-height: 1.4;
      padding: 12px 16px 16px;
    }
    .search-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 12px;
      margin-bottom: 12px;
      color: var(--secondary-text-color);
    }
    .search-row input {
      flex: 1;
      background: transparent;
      border: 0;
      outline: 0;
      font-size: 1em;
      color: var(--primary-text-color);
      font-family: inherit;
    }
    .group-select,
    .toolbar-select {
      background: #ffffff;
      border: 1px solid var(--divider-color, #888);
      border-radius: 8px;
      color: #1a1a1a;
      padding: 4px 8px;
      font-family: inherit;
      font-size: 0.85em;
      cursor: pointer;
      flex: 1;
      min-width: 0;
    }
    .group-select option,
    .toolbar-select option {
      background: #ffffff;
      color: #1a1a1a;
    }
    .icon-btn {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      color: var(--primary-text-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-btn:hover {
      background: var(--secondary-background-color);
    }
    .toolbar-row {
      display: flex;
      gap: 6px;
      align-items: stretch;
      margin-bottom: 8px;
    }
    .view-toggle {
      display: inline-flex;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }
    .view-toggle button {
      background: var(--card-background-color);
      border: 0;
      color: var(--primary-text-color);
      padding: 4px 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
    }
    .view-toggle button.active {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
    }
    .view-toggle ha-icon {
      --mdc-icon-size: 18px;
    }
    .chip-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-size: 0.85em;
      font-family: inherit;
      transition: background 0.15s, border-color 0.15s;
    }
    .chip ha-icon {
      --mdc-icon-size: 14px;
    }
    .chip.active {
      background: var(--primary-color);
      color: var(--text-primary-color, white);
      border-color: var(--primary-color);
    }

    /* "Cook again" carousel */
    .cook-again-section {
      margin-bottom: 16px;
    }
    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.95em;
      font-weight: 500;
      margin: 8px 0;
      color: var(--secondary-text-color);
    }
    .section-header ha-icon {
      --mdc-icon-size: 18px;
    }
    .cook-again-row {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 6px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    .cook-again-row::-webkit-scrollbar {
      height: 4px;
    }
    .cook-again-row::-webkit-scrollbar-thumb {
      background: var(--divider-color);
      border-radius: 2px;
    }
    .mini-tile {
      flex: 0 0 110px;
      scroll-snap-align: start;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      text-align: left;
      color: inherit;
      font-family: inherit;
    }
    .mini-hero {
      width: 100%;
      aspect-ratio: 1.2 / 1;
      background-size: cover;
      background-position: center;
      background-color: var(--secondary-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mini-hero ha-icon {
      color: var(--secondary-text-color);
    }
    .mini-name {
      padding: 6px 8px 0;
      font-size: 0.8em;
      font-weight: 500;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .mini-sub {
      padding: 2px 8px 8px;
      font-size: 0.7em;
      color: var(--secondary-text-color);
    }

    /* List view */
    .recipe-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .list-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      color: inherit;
      font-family: inherit;
      transition: background 0.1s;
    }
    .list-row:hover {
      background: var(--secondary-background-color);
    }
    .list-thumb {
      flex: 0 0 56px;
      width: 56px;
      height: 56px;
      border-radius: 8px;
      background-size: cover;
      background-position: center;
      background-color: var(--secondary-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .list-thumb ha-icon {
      --mdc-icon-size: 24px;
      color: var(--secondary-text-color);
    }
    .list-content {
      flex: 1;
      min-width: 0;
    }
    .list-name {
      font-weight: 500;
      font-size: 0.95em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .list-sub {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 0.75em;
      color: var(--secondary-text-color);
      margin-top: 2px;
    }
    .list-sub span {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .list-sub ha-icon {
      --mdc-icon-size: 12px;
    }
    .list-tags {
      font-style: italic;
    }
    .list-source {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }
    .group {
      margin-bottom: 24px;
    }
    .group-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin: 16px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid var(--divider-color);
    }
    .group-name {
      font-size: 1.1em;
      font-weight: 500;
      text-transform: capitalize;
    }
    .group-count {
      color: var(--secondary-text-color);
      font-size: 0.85em;
    }
    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
    .tag {
      background: var(--secondary-background-color);
      border: 0;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 0.85em;
      cursor: pointer;
      color: var(--primary-text-color);
      font-family: inherit;
    }
    .tag.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(220px, 100%), 1fr)
      );
      gap: 12px;
    }
    @media (min-width: 700px) {
      .grid {
        grid-template-columns: repeat(var(--cols, 3), 1fr);
      }
    }
    .recipe-tile {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      text-align: left;
      transition: transform 0.15s, box-shadow 0.15s;
      font-family: inherit;
      color: var(--primary-text-color);
    }
    .recipe-tile:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .hero {
      aspect-ratio: 16 / 10;
      background-size: cover;
      background-position: center;
      background-color: var(--secondary-background-color);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .source-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .source-badge ha-icon {
      --mdc-icon-size: 16px;
    }
    .hero.no-image ha-icon {
      --mdc-icon-size: 48px;
      color: var(--secondary-text-color);
      opacity: 0.5;
    }
    .meta {
      padding: 12px;
    }
    .name {
      font-weight: 500;
      font-size: 1em;
      margin-bottom: 6px;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .sub {
      display: flex;
      gap: 12px;
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-bottom: 6px;
    }
    .sub span {
      display: inline-flex;
      align-items: center;
      gap: 2px;
    }
    .sub ha-icon {
      --mdc-icon-size: 14px;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .tag-chip {
      background: var(--secondary-background-color);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.75em;
    }
    .empty {
      padding: 48px 16px;
      text-align: center;
      color: var(--secondary-text-color);
    }
  `,e([he({attribute:!1})],_e.prototype,"recipes",void 0),e([he({type:Number})],_e.prototype,"columns",void 0),e([he({type:Boolean})],_e.prototype,"showFilters",void 0),e([he({type:String})],_e.prototype,"groupBy",void 0),e([ge()],_e.prototype,"_search",void 0),e([ge()],_e.prototype,"_activeTags",void 0),e([ge()],_e.prototype,"_activeChips",void 0),e([ge()],_e.prototype,"_groupOverride",void 0),e([ge()],_e.prototype,"_sortBy",void 0),e([ge()],_e.prototype,"_viewMode",void 0),_e=e([le("recipe-box-library-view")],_e);class fe{constructor(e){this.hass=e}preview(e,t,i){const o={url:e};return t&&(o.html=t),i&&(o.text=i),this.hass.callApi("POST","recipe_box/preview",o)}list(){return this.hass.callApi("GET","recipe_box/recipes")}get(e){return this.hass.callApi("GET",`recipe_box/recipes/${e}`)}save(e,t={}){return this.hass.callApi("POST","recipe_box/recipes",{recipe:e,...t})}update(e,t){return this.hass.callApi("PUT",`recipe_box/recipes/${e}`,{recipe:t})}delete(e){return this.hass.callApi("DELETE",`recipe_box/recipes/${e}`)}markCooked(e){return this.hass.callApi("POST",`recipe_box/recipes/${e}/cooked`)}shoppingPreview(e,t,i,o=!0){return this.hass.callApi("POST",`recipe_box/recipes/${e}/shopping_preview`,{todo_entity:t,servings:i,compact:o})}uploadFile(e){return this.hass.callApi("POST","recipe_box/upload",e)}attachmentUrl(e){return`/api/recipe_box/recipes/${e}/attachment`}}function be(e){if(e instanceof Error)return e.message;if("string"==typeof e)return e;if("object"!=typeof e||null===e)return String(e);const t=e;if("object"==typeof t.body&&null!==t.body){const e=t.body;if("string"==typeof e.message){const i=t.status_code?` (HTTP ${t.status_code})`:"";return e.message+i}}if("string"==typeof t.message)return t.message;try{return JSON.stringify(e)}catch{return"Unknown error"}}let xe=class extends ne{constructor(){super(...arguments),this.slug="",this._shoppingOpen=!1,this._shoppingItems=[],this._shoppingTodo="",this._shoppingCompact=!0,this._busy=!1,this._confirmDelete=!1,this._editing=!1,this._savingEdit=!1,this._newTagInput="",this._attachmentBlobUrl="",this._attachmentLoading=!1,this._attachmentError="",this._lastLoadedSlug=""}willUpdate(e){super.willUpdate?.(e),this.recipe&&this.slug&&this.slug!==this._lastLoadedSlug&&(this._lastLoadedSlug=this.slug,this._loadAttachmentIfNeeded())}disconnectedCallback(){super.disconnectedCallback(),this._attachmentBlobUrl&&(URL.revokeObjectURL(this._attachmentBlobUrl),this._attachmentBlobUrl="")}async _loadAttachmentIfNeeded(){this._attachmentBlobUrl&&(URL.revokeObjectURL(this._attachmentBlobUrl),this._attachmentBlobUrl="");const e=this.recipe?._recipebox;if(e&&e.source_file&&("pdf"===e.source_type||"image"===e.source_type)){this._attachmentLoading=!0,this._attachmentError="";try{const e=this.hass.auth,t=e?.data?.access_token??e?.accessToken,i=t?{Authorization:`Bearer ${t}`}:{},o=await fetch(`/api/recipe_box/recipes/${this.slug}/attachment`,{headers:i});if(!o.ok)throw new Error(`HTTP ${o.status}`);const r=await o.blob();this._attachmentBlobUrl=URL.createObjectURL(r)}catch(e){this._attachmentError=e instanceof Error?e.message:String(e)}finally{this._attachmentLoading=!1}}}render(){if(!this.recipe)return F`<div class="loading">Loading...</div>`;const e=this._editing&&this._draft?this._draft:this.recipe,t=e._recipebox;return F`
      <div class="recipe">
        ${e.image?F`<div class="hero" style="background-image: url('${e.image}')"></div>`:W}

        <div class="content">
          ${this._editing?this._renderEditableHeader(e):e.description?F`<p class="description">${e.description}</p>`:W}

          <div class="facts">
            ${e.totalTime?this._fact("mdi:clock-outline","Total",ue(e.totalTime)):W}
            ${e.prepTime?this._fact("mdi:knife","Prep",ue(e.prepTime)):W}
            ${e.cookTime?this._fact("mdi:pot-steam","Cook",ue(e.cookTime)):W}
            ${this._editing?this._editableYieldFact(e):e.recipeYield?this._fact("mdi:scale","Yields",e.recipeYield):W}
            ${t.cooked_count>0?this._fact("mdi:silverware","Cooked",`${t.cooked_count}× (${me(t.last_cooked)})`):W}
          </div>

          ${this._editing?W:F`
          <div class="actions">
            <button class="primary" @click=${this._startCooking}>
              <ha-icon icon="mdi:chef-hat"></ha-icon> Cook mode
            </button>
            <button @click=${this._toggleShopping}>
              <ha-icon icon="mdi:cart-plus"></ha-icon> Send to list
            </button>
            <button @click=${this._markCooked} ?disabled=${this._busy}>
              <ha-icon icon="mdi:check"></ha-icon> Mark cooked
            </button>
            <button @click=${this._startEdit}>
              <ha-icon icon="mdi:pencil"></ha-icon> Edit
            </button>
            ${t.source_url?F`<a class="source" href=${t.source_url} target="_blank" rel="noreferrer">
                  <ha-icon icon="mdi:open-in-new"></ha-icon> ${t.source_host}
                </a>`:t.source_type?F`<span class="source">
                  <ha-icon icon=${"pdf"===t.source_type?"mdi:file-pdf-box":"mdi:image"}></ha-icon>
                  ${"pdf"===t.source_type?"PDF":"Photo"}
                </span>`:W}
          </div>`}

          ${this._renderAttachment(t)}

          ${this._shoppingOpen&&!this._editing?this._renderShoppingPanel():W}

          ${this._shouldShowIngredients(e)?F`<h3>Ingredients</h3>
              ${this._editing?this._renderEditableIngredients(e):F`<ul class="ingredients">
                    ${e.recipeIngredient.map(e=>F`<li>${e}</li>`)}
                  </ul>`}`:W}

          ${this._shouldShowInstructions(e)?F`<h3>Instructions</h3>
              ${this._editing?this._renderEditableInstructions(e):F`<ol class="instructions">
                    ${e.recipeInstructions.map((e,t)=>F`<li><span class="step-num">${t+1}</span>${e.text}</li>`)}
                  </ol>`}`:W}

          ${this._editing?this._renderEditableNotes(t):t.notes?F`<h3>Notes</h3>
                <p class="notes">${t.notes}</p>`:W}

          ${this._editing?this._renderEditableTags(t):t.tags.length?F`<div class="tags">
                ${t.tags.map(e=>F`<span class="tag-chip">${e}</span>`)}
              </div>`:W}

          ${this._editError?F`<div class="edit-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon> ${this._editError}
              </div>`:W}

          <div class="footer-actions">
            ${this._editing?F`<button @click=${this._cancelEdit} ?disabled=${this._savingEdit}>
                    Cancel
                  </button>
                  <button class="primary" @click=${this._saveEdit} ?disabled=${this._savingEdit}>
                    ${this._savingEdit?"Saving...":"Save changes"}
                  </button>`:this._confirmDelete?F`<span>Delete this recipe?</span>
                  <button class="danger" @click=${this._delete}>Yes, delete</button>
                  <button @click=${()=>this._confirmDelete=!1}>Cancel</button>`:F`<button class="danger-link" @click=${()=>this._confirmDelete=!0}>
                  Delete recipe
                </button>`}
          </div>
        </div>
      </div>
    `}_fact(e,t,i){return F`
      <div class="fact">
        <ha-icon icon=${e}></ha-icon>
        <div>
          <div class="fact-label">${t}</div>
          <div class="fact-value">${i}</div>
        </div>
      </div>
    `}_shouldShowIngredients(e){if(this._editing)return!0;if(e.recipeIngredient.length>0)return!0;const t=e._recipebox;return!("pdf"===t.source_type||"image"===t.source_type)}_shouldShowInstructions(e){if(this._editing)return!0;if(e.recipeInstructions.length>0)return!0;const t=e._recipebox;return!("pdf"===t.source_type||"image"===t.source_type)}_renderAttachment(e){return"pdf"!==e.source_type&&"image"!==e.source_type?F``:this._attachmentLoading?F`
        <div class="attachment-loading">
          <ha-icon icon="mdi:loading" class="spin"></ha-icon> Loading
          ${"pdf"===e.source_type?"PDF":"image"}...
        </div>
      `:this._attachmentError?F`
        <div class="attachment-error">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          Couldn't load attachment: ${this._attachmentError}
        </div>
      `:this._attachmentBlobUrl?"image"===e.source_type?F`
        <div class="attachment image">
          <img
            src=${this._attachmentBlobUrl}
            alt=${this.recipe?.name??""}
            @click=${()=>window.open(this._attachmentBlobUrl,"_blank")}
          />
        </div>
      `:F`
      <div class="attachment pdf">
        <iframe
          src=${this._attachmentBlobUrl}
          title="Recipe PDF"
          loading="lazy"
        ></iframe>
        <div class="attachment-actions">
          <a href=${this._attachmentBlobUrl} target="_blank" rel="noreferrer">
            <ha-icon icon="mdi:open-in-new"></ha-icon> Open in new tab
          </a>
        </div>
      </div>
    `:F``}_renderEditableHeader(e){return F`
      <div class="edit-block">
        <label class="edit-label">Name</label>
        <input
          class="edit-input edit-name"
          type="text"
          .value=${e.name}
          @input=${e=>{this._patchDraft({name:e.target.value})}}
        />
        <label class="edit-label">Description</label>
        <textarea
          class="edit-input"
          rows="2"
          .value=${e.description??""}
          @input=${e=>this._patchDraft({description:e.target.value})}
        ></textarea>
        <label class="edit-label">
          Image URL
          <span class="edit-hint">
            paste an image link — Google image search, Imgur, the recipe
            site itself
          </span>
        </label>
        <input
          class="edit-input"
          type="url"
          placeholder="https://..."
          .value=${e.image??""}
          @input=${e=>this._patchDraft({image:e.target.value})}
        />
        ${e.image?F`<div class="edit-image-preview">
              <img
                src=${e.image}
                alt="preview"
                @error=${e=>e.target.style.display="none"}
              />
              <button
                type="button"
                class="text-btn"
                @click=${()=>this._patchDraft({image:""})}
              >
                <ha-icon icon="mdi:close"></ha-icon> Remove
              </button>
            </div>`:W}
      </div>
    `}_editableYieldFact(e){return F`
      <div class="fact fact-edit">
        <ha-icon icon="mdi:scale"></ha-icon>
        <div>
          <div class="fact-label">Yields</div>
          <input
            class="edit-input fact-input"
            type="text"
            .value=${e.recipeYield??""}
            @input=${e=>this._patchDraft({recipeYield:e.target.value})}
            placeholder="e.g. 24 cookies"
          />
        </div>
      </div>
    `}_renderEditableIngredients(e){return F`
      <ul class="edit-list">
        ${e.recipeIngredient.map((e,t)=>F`<li class="edit-row">
            <input
              type="text"
              class="edit-input"
              .value=${e}
              @input=${e=>this._patchIngredient(t,e.target.value)}
            />
            <button
              class="edit-remove"
              title="Remove"
              @click=${()=>this._removeIngredient(t)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </li>`)}
      </ul>
      <button class="edit-add" @click=${this._addIngredient}>
        <ha-icon icon="mdi:plus"></ha-icon> Add ingredient
      </button>
    `}_renderEditableInstructions(e){return F`
      <ol class="edit-list">
        ${e.recipeInstructions.map((e,t)=>F`<li class="edit-row edit-row-step">
            <span class="step-num">${t+1}</span>
            <textarea
              class="edit-input"
              rows="2"
              .value=${e.text}
              @input=${e=>this._patchInstruction(t,e.target.value)}
            ></textarea>
            <button
              class="edit-remove"
              title="Remove"
              @click=${()=>this._removeInstruction(t)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </li>`)}
      </ol>
      <button class="edit-add" @click=${this._addInstruction}>
        <ha-icon icon="mdi:plus"></ha-icon> Add step
      </button>
    `}_renderEditableNotes(e){return F`
      <h3>Notes</h3>
      <textarea
        class="edit-input edit-notes"
        rows="4"
        placeholder="Notes — adjustments, substitutions, observations..."
        .value=${e.notes}
        @input=${e=>this._patchMeta({notes:e.target.value})}
      ></textarea>
    `}_renderEditableTags(e){return F`
      <div class="tag-editor">
        ${e.tags.map(e=>F`<span class="tag-chip editable">
            ${e}
            <button @click=${()=>this._removeTag(e)} title="Remove tag">
              <ha-icon icon="mdi:close"></ha-icon>
            </button>
          </span>`)}
        <input
          type="text"
          .value=${this._newTagInput}
          placeholder="Add tag..."
          @input=${e=>this._newTagInput=e.target.value}
          @keydown=${e=>{"Enter"!==e.key&&","!==e.key||(e.preventDefault(),this._commitNewTag())}}
          @blur=${this._commitNewTag}
        />
      </div>
    `}_startEdit(){this.recipe&&(this._draft=JSON.parse(JSON.stringify(this.recipe)),this._editError=void 0,this._editing=!0,this._shoppingOpen=!1,this._confirmDelete=!1)}_cancelEdit(){this._editing=!1,this._draft=void 0,this._editError=void 0,this._newTagInput=""}async _saveEdit(){if(this.api&&this._draft){this._savingEdit=!0,this._editError=void 0;try{this._commitNewTag();const e=this._cleanDraft(this._draft),t=await this.api.update(this.slug,e);this.recipe=t.recipe,this._editing=!1,this._draft=void 0,this.dispatchEvent(new CustomEvent("recipe-updated",{detail:{slug:this.slug,recipe:t.recipe},bubbles:!0,composed:!0}))}catch(e){this._editError=be(e)}finally{this._savingEdit=!1}}}_patchDraft(e){this._draft&&(this._draft={...this._draft,...e})}_patchMeta(e){this._draft&&(this._draft={...this._draft,_recipebox:{...this._draft._recipebox,...e}})}_patchIngredient(e,t){if(!this._draft)return;const i=[...this._draft.recipeIngredient];i[e]=t,this._draft={...this._draft,recipeIngredient:i}}_addIngredient(){this._draft&&(this._draft={...this._draft,recipeIngredient:[...this._draft.recipeIngredient,""]})}_removeIngredient(e){if(!this._draft)return;const t=this._draft.recipeIngredient.filter((t,i)=>i!==e);this._draft={...this._draft,recipeIngredient:t}}_patchInstruction(e,t){if(!this._draft)return;const i=[...this._draft.recipeInstructions];i[e]={...i[e],text:t},this._draft={...this._draft,recipeInstructions:i}}_addInstruction(){this._draft&&(this._draft={...this._draft,recipeInstructions:[...this._draft.recipeInstructions,{"@type":"HowToStep",text:""}]})}_removeInstruction(e){if(!this._draft)return;const t=this._draft.recipeInstructions.filter((t,i)=>i!==e);this._draft={...this._draft,recipeInstructions:t}}_commitNewTag(){const e=this._newTagInput.trim().toLowerCase().replace(/,$/,"");e&&this._draft?(this._draft._recipebox.tags.includes(e)||this._patchMeta({tags:[...this._draft._recipebox.tags,e]}),this._newTagInput=""):this._newTagInput=""}_removeTag(e){this._draft&&this._patchMeta({tags:this._draft._recipebox.tags.filter(t=>t!==e)})}_cleanDraft(e){const t={...e,recipeIngredient:e.recipeIngredient.map(e=>e.trim()).filter(e=>e.length>0),recipeInstructions:e.recipeInstructions.map(e=>({...e,text:e.text.trim()})).filter(e=>e.text.length>0)};return t}_renderShoppingPanel(){const e=Object.keys(this.hass.states).filter(e=>e.startsWith("todo."));return F`
      <div class="panel">
        <div class="panel-row">
          <label>List:</label>
          <select
            .value=${this._shoppingTodo}
            @change=${e=>{this._shoppingTodo=e.target.value,this._rememberLastTodo(),this._refreshShopping()}}
          >
            <option value="">— pick a list —</option>
            ${e.map(e=>F`<option value=${e}>${e.replace("todo.","")}</option>`)}
          </select>
        </div>
        <div class="panel-row">
          <label>Servings:</label>
          <input
            type="number"
            min="1"
            step="0.5"
            .value=${this._shoppingServings?.toString()??""}
            placeholder="default"
            @change=${e=>{const t=parseFloat(e.target.value);this._shoppingServings=isNaN(t)?void 0:t,this._refreshShopping()}}
          />
        </div>
        <div class="panel-row">
          <label>Format:</label>
          <div class="seg-toggle">
            <button
              class=${this._shoppingCompact?"active":""}
              @click=${()=>this._setCompact(!0)}
              title='"flour" instead of "2 1/4 cups all-purpose flour"'
            >
              Just items
            </button>
            <button
              class=${this._shoppingCompact?"":"active"}
              @click=${()=>this._setCompact(!1)}
              title="Send full ingredient lines as written"
            >
              Full lines
            </button>
          </div>
        </div>
        ${this._shoppingItems.length?F`<div class="shopping-items">
                ${this._shoppingItems.map((e,t)=>this._renderShoppingItem(e,t))}
              </div>
              <div class="panel-row right">
                <button @click=${this._toggleShopping}>Cancel</button>
                <button
                  class="primary"
                  @click=${this._sendShopping}
                  ?disabled=${this._busy}
                >
                  Add ${this._shoppingItems.filter(e=>!e.already_on_list).length} items
                </button>
              </div>`:this._shoppingTodo?F`<div class="muted">Loading...</div>`:W}
      </div>
    `}_renderShoppingItem(e,t){return F`
      <div class="shopping-item">
        <input
          class="row-check"
          type="checkbox"
          ?checked=${!e.already_on_list}
          @change=${e=>{const i=e.target.checked;this._shoppingItems=this._shoppingItems.map((e,o)=>o===t?{...e,already_on_list:!i}:e)}}
        />
        <input
          class="row-text ${e.already_on_list?"muted":""}"
          type="text"
          .value=${e.text}
          @input=${e=>{const i=e.target.value;this._shoppingItems=this._shoppingItems.map((e,o)=>o===t?{...e,text:i}:e)}}
          title=${e.original??e.text}
        />
        ${e.matched_item?F`<span class="match-hint" title="Already on list">
              ⓘ
            </span>`:W}
      </div>
    `}_startCooking(){this.dispatchEvent(new CustomEvent("start-cooking",{bubbles:!0,composed:!0}))}async _toggleShopping(){this._shoppingOpen=!this._shoppingOpen,this._shoppingOpen&&(this._shoppingTodo=localStorage.getItem("recipe-box-last-todo")||this.defaultTodo||"",this._shoppingCompact="false"!==localStorage.getItem("recipe-box-shopping-compact"),this._shoppingItems=[],this._shoppingTodo&&await this._refreshShopping())}_rememberLastTodo(){this._shoppingTodo&&localStorage.setItem("recipe-box-last-todo",this._shoppingTodo)}_setCompact(e){this._shoppingCompact=e,localStorage.setItem("recipe-box-shopping-compact",e?"true":"false"),this._refreshShopping()}async _refreshShopping(){if(this._shoppingTodo&&this.api)try{const e=await this.api.shoppingPreview(this.slug,this._shoppingTodo,this._shoppingServings,this._shoppingCompact);this._shoppingItems=e.items}catch(e){console.error(e)}}async _sendShopping(){if(this._shoppingTodo){this._busy=!0;try{for(const e of this._shoppingItems)!e.already_on_list&&e.text.trim()&&await this.hass.callService("todo","add_item",{item:e.text.trim()},{entity_id:this._shoppingTodo});this._shoppingOpen=!1}finally{this._busy=!1}}}async _markCooked(){if(this.api){this._busy=!0;try{const e=await this.api.markCooked(this.slug);this.recipe=e}finally{this._busy=!1}}}async _delete(){this.api&&(await this.api.delete(this.slug),this.dispatchEvent(new CustomEvent("recipe-deleted",{bubbles:!0,composed:!0})))}};xe.styles=a`
    :host {
      display: block;
      font-size: var(--recipe-box-base-font-size, 14px);
      line-height: 1.4;
    }
    .hero {
      aspect-ratio: 16 / 9;
      background-size: cover;
      background-position: center;
    }
    .content {
      padding: 16px;
    }
    .description {
      color: var(--secondary-text-color);
      font-style: italic;
      margin: 0 0 16px;
    }
    .facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .fact {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 8px;
    }
    .fact ha-icon {
      --mdc-icon-size: 24px;
      color: var(--primary-color);
    }
    .fact-label {
      font-size: 0.75em;
      color: var(--secondary-text-color);
      text-transform: uppercase;
    }
    .fact-value {
      font-weight: 500;
      font-size: 0.95em;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }
    .actions button,
    .actions a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: transparent;
      color: var(--primary-text-color);
      cursor: pointer;
      font-family: inherit;
      font-size: 0.95em;
      text-decoration: none;
    }
    .actions button:hover {
      background: var(--secondary-background-color);
    }
    .actions .primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .actions .source {
      margin-left: auto;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .panel {
      background: var(--secondary-background-color);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .panel-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .panel-row label {
      min-width: 80px;
      font-weight: 500;
    }
    .panel-row.right {
      justify-content: flex-end;
    }
    .panel-row select,
    .panel-row input {
      flex: 1;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--divider-color, #888);
      /* Force solid colors regardless of theme overrides — glassmorphism
         dashboards make --card-background-color translucent which leaves
         <option> popups unreadable since native option rendering ignores
         most CSS. Explicit white-bg/black-fg works on both light and
         dark themes and in the OS popup. */
      background: #ffffff;
      color: #1a1a1a;
      font-family: inherit;
      font-size: inherit;
    }
    /* Native <option> elements use OS rendering — explicit colors here
       guarantee visibility in the dropdown popup on both Android and iOS */
    .panel-row select option {
      background: #ffffff;
      color: #1a1a1a;
    }
    .shopping-items {
      max-height: 320px;
      overflow-y: auto;
      margin: 12px 0;
    }
    .shopping-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }
    .row-check {
      flex-shrink: 0;
    }
    .row-text {
      flex: 1;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid transparent;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 0.95em;
      min-width: 0;
    }
    .row-text:hover {
      border-color: var(--divider-color);
    }
    .row-text:focus {
      outline: none;
      border-color: var(--primary-color);
      background: var(--secondary-background-color);
    }
    .row-text.muted {
      color: var(--secondary-text-color);
      text-decoration: line-through;
    }
    .match-hint {
      font-size: 0.85em;
      color: var(--warning-color, #f59e0b);
      flex-shrink: 0;
      cursor: help;
    }
    .seg-toggle {
      display: inline-flex;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      overflow: hidden;
    }
    .seg-toggle button {
      background: transparent;
      border: 0;
      color: var(--primary-text-color);
      padding: 6px 14px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9em;
    }
    .seg-toggle button.active {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    h3 {
      margin: 24px 0 12px;
      font-size: 1.15em;
    }
    .ingredients {
      list-style: none;
      padding: 0;
    }
    .ingredients li {
      padding: 6px 0;
      border-bottom: 1px solid var(--divider-color);
    }
    .instructions {
      list-style: none;
      padding: 0;
    }
    .instructions li {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      line-height: 1.5;
    }
    .step-num {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-color);
      color: var(--text-primary-color);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
      font-size: 0.9em;
    }
    .notes {
      background: var(--secondary-background-color);
      padding: 12px;
      border-radius: 8px;
      white-space: pre-wrap;
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 16px;
    }
    .tag-chip {
      background: var(--secondary-background-color);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.85em;
    }
    .footer-actions {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .danger-link {
      background: transparent;
      border: 0;
      color: var(--error-color);
      cursor: pointer;
      font-family: inherit;
    }
    .danger {
      background: var(--error-color);
      color: var(--text-primary-color);
      border: 0;
      border-radius: 8px;
      padding: 6px 14px;
      cursor: pointer;
      font-family: inherit;
    }
    .loading {
      padding: 48px;
      text-align: center;
    }

    /* ----- Edit mode ----- */
    .edit-block {
      margin-bottom: 16px;
    }
    .edit-label {
      display: block;
      font-size: 0.75em;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--secondary-text-color);
      margin: 8px 0 4px;
    }
    .edit-input {
      width: 100%;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 1em;
      box-sizing: border-box;
      resize: vertical;
    }
    .edit-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }
    .edit-name {
      font-size: 1.2em;
      font-weight: 500;
    }
    .edit-hint {
      display: block;
      font-size: 0.85em;
      font-weight: normal;
      color: var(--secondary-text-color);
      text-transform: none;
      letter-spacing: normal;
      margin-top: 2px;
    }
    .edit-image-preview {
      position: relative;
      margin-top: 8px;
      border-radius: 8px;
      overflow: hidden;
      max-width: 280px;
    }
    .edit-image-preview img {
      display: block;
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      background: var(--secondary-background-color);
    }
    .edit-image-preview .text-btn {
      position: absolute;
      top: 6px;
      right: 6px;
      background: rgba(0, 0, 0, 0.65);
      color: white;
      border: 0;
      padding: 4px 10px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.8em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: inherit;
    }
    .edit-image-preview .text-btn ha-icon {
      --mdc-icon-size: 14px;
    }
    .edit-notes {
      margin-top: 8px;
    }
    .fact-edit {
      flex-direction: row;
      align-items: center;
    }
    .fact-input {
      width: 100%;
      padding: 4px 8px;
      font-size: 0.95em;
    }
    .edit-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .edit-row {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 4px 0;
    }
    .edit-row-step {
      align-items: flex-start;
    }
    .edit-row-step .step-num {
      margin-top: 6px;
    }
    .edit-row .edit-input {
      flex: 1;
    }
    .edit-remove {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 0;
      background: transparent;
      color: var(--secondary-text-color);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .edit-remove:hover {
      background: var(--secondary-background-color);
      color: var(--error-color);
    }
    .edit-add {
      margin-top: 12px;
      background: transparent;
      border: 1px dashed var(--divider-color);
      color: var(--secondary-text-color);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-family: inherit;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .edit-add:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .tag-editor {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      margin-top: 12px;
    }
    .tag-editor input {
      flex: 1;
      min-width: 120px;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 0.9em;
    }
    .tag-chip.editable {
      background: var(--primary-color);
      color: var(--text-primary-color);
      padding: 2px 4px 2px 10px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .tag-chip.editable button {
      background: transparent;
      border: 0;
      color: inherit;
      cursor: pointer;
      padding: 2px;
      border-radius: 50%;
      display: inline-flex;
    }
    .tag-chip.editable button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .tag-chip.editable ha-icon {
      --mdc-icon-size: 14px;
    }
    .footer-actions .primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border: 0;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-family: inherit;
      margin-left: auto;
    }
    .footer-actions button:not(.danger):not(.danger-link):not(.primary) {
      background: transparent;
      border: 1px solid var(--divider-color);
      color: var(--primary-text-color);
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-family: inherit;
    }
    .footer-actions button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .edit-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(244, 67, 54, 0.1);
      color: var(--error-color);
      margin-top: 16px;
    }

    /* ---- Document attachments (PDF / photo) ---- */
    .attachment {
      margin: 16px 0 24px;
      border-radius: 12px;
      overflow: hidden;
      background: var(--secondary-background-color);
    }
    .attachment.image img {
      display: block;
      width: 100%;
      max-height: 70vh;
      object-fit: contain;
      cursor: zoom-in;
      background: #000;
    }
    .attachment.pdf iframe {
      display: block;
      width: 100%;
      height: 70vh;
      border: 0;
      background: #525659;
    }
    .attachment-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 12px;
    }
    .attachment-actions a {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--primary-text-color);
      text-decoration: none;
      font-size: 0.9em;
      padding: 6px 12px;
      border-radius: 6px;
    }
    .attachment-actions a:hover {
      background: var(--secondary-background-color);
    }
    .attachment-loading,
    .attachment-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      margin: 16px 0;
      border-radius: 8px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }
    .attachment-error {
      color: var(--error-color);
      background: rgba(244, 67, 54, 0.08);
    }
    .spin {
      animation: detail-spin 1.2s linear infinite;
    }
    @keyframes detail-spin {
      to {
        transform: rotate(360deg);
      }
    }
    .source {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  `,e([he({attribute:!1})],xe.prototype,"hass",void 0),e([he({attribute:!1})],xe.prototype,"recipe",void 0),e([he()],xe.prototype,"slug",void 0),e([he()],xe.prototype,"defaultTodo",void 0),e([he({attribute:!1})],xe.prototype,"api",void 0),e([ge()],xe.prototype,"_shoppingOpen",void 0),e([ge()],xe.prototype,"_shoppingItems",void 0),e([ge()],xe.prototype,"_shoppingTodo",void 0),e([ge()],xe.prototype,"_shoppingServings",void 0),e([ge()],xe.prototype,"_shoppingCompact",void 0),e([ge()],xe.prototype,"_busy",void 0),e([ge()],xe.prototype,"_confirmDelete",void 0),e([ge()],xe.prototype,"_editing",void 0),e([ge()],xe.prototype,"_draft",void 0),e([ge()],xe.prototype,"_savingEdit",void 0),e([ge()],xe.prototype,"_editError",void 0),e([ge()],xe.prototype,"_newTagInput",void 0),e([ge()],xe.prototype,"_attachmentBlobUrl",void 0),e([ge()],xe.prototype,"_attachmentLoading",void 0),e([ge()],xe.prototype,"_attachmentError",void 0),xe=e([le("recipe-box-detail-view")],xe);let ye=class extends ne{constructor(){super(...arguments),this.slug="",this._stepIndex=0,this._checked=new Set,this._wakeLockHeld=!1,this._wakeLock=null}connectedCallback(){super.connectedCallback(),this._acquireWakeLock()}disconnectedCallback(){super.disconnectedCallback(),this._releaseWakeLock()}async _acquireWakeLock(){try{const e=navigator;e.wakeLock?.request&&(this._wakeLock=await e.wakeLock.request("screen"),this._wakeLockHeld=!0)}catch(e){console.warn("Could not acquire wake lock:",e)}}_releaseWakeLock(){this._wakeLock&&(this._wakeLock.release?.(),this._wakeLock=null,this._wakeLockHeld=!1)}_toggleIngredient(e){this._checked.has(e)?this._checked.delete(e):this._checked.add(e),this._checked=new Set(this._checked)}_next(){this.recipe&&(this._stepIndex<this.recipe.recipeInstructions.length-1?this._stepIndex++:this._finish())}_prev(){this._stepIndex>0&&this._stepIndex--}async _finish(){if(this.api)try{await this.api.markCooked(this.slug)}catch(e){console.warn(e)}this.dispatchEvent(new CustomEvent("cooking-finished",{bubbles:!0,composed:!0}))}_startTimer(e,t){const i=Object.keys(this.hass.states).filter(e=>e.startsWith("timer."));i.length>0?this.hass.callService("timer","start",{duration:`00:${String(e).padStart(2,"0")}:00`},{entity_id:i[0]}):this.hass.callService("persistent_notification","create",{title:"Recipe timer",message:`${t}: ${e} minutes`})}render(){if(!this.recipe)return F`<div class="loading">Loading...</div>`;const e=this.recipe,t=e.recipeInstructions.length,i=e.recipeInstructions[this._stepIndex],o=function(e){const t=e.match(/(\d+)\s*(?:-|to)\s*(\d+)\s*(min|minute|minutes|hr|hour|hours)/i);if(t){const e=parseInt(t[1],10);return/h/i.test(t[3])?60*e:e}let i=0;const o=e.match(/(\d+)\s*(?:hr|hour|hours)/i);o&&(i+=60*parseInt(o[1],10));const r=e.match(/(\d+)\s*(?:min|minute|minutes)/i);return r&&(i+=parseInt(r[1],10)),i||null}(i?.text??""),r=this._stepIndex===t-1;return F`
      <div class="cook">
        <div class="ingredients-strip">
          <details>
            <summary>
              Ingredients
              <span class="counter">
                ${this._checked.size}/${e.recipeIngredient.length}
              </span>
            </summary>
            <ul>
              ${e.recipeIngredient.map((e,t)=>F`<li
                  class=${this._checked.has(t)?"checked":""}
                  @click=${()=>this._toggleIngredient(t)}
                >
                  <ha-icon
                    icon=${this._checked.has(t)?"mdi:checkbox-marked-circle":"mdi:checkbox-blank-circle-outline"}
                  ></ha-icon>
                  <span>${e}</span>
                </li>`)}
            </ul>
          </details>
        </div>

        <div class="step">
          <div class="step-meta">
            Step ${this._stepIndex+1} of ${t}
          </div>
          <div class="step-text">${i?.text}</div>
          ${o?F`<button class="timer-btn" @click=${()=>this._startTimer(o,`Step ${this._stepIndex+1}`)}>
                <ha-icon icon="mdi:timer-outline"></ha-icon>
                Start ${o}-minute timer
              </button>`:W}
        </div>

        <div class="progress">
          <div class="bar" style="width: ${(this._stepIndex+1)/t*100}%"></div>
        </div>

        <div class="nav">
          <button
            class="nav-btn"
            ?disabled=${0===this._stepIndex}
            @click=${this._prev}
          >
            <ha-icon icon="mdi:chevron-left"></ha-icon> Previous
          </button>
          <button class="nav-btn primary" @click=${this._next}>
            ${r?"Finish":"Next"}
            <ha-icon icon=${r?"mdi:check":"mdi:chevron-right"}></ha-icon>
          </button>
        </div>

        ${this._wakeLockHeld?F`<div class="wake-indicator" title="Screen will stay on">
              <ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>
            </div>`:W}
      </div>
    `}};ye.styles=a`
    :host {
      display: block;
      font-size: var(--recipe-box-base-font-size, 14px);
      line-height: 1.4;
    }
    .cook {
      padding: 16px;
      min-height: 60vh;
      display: flex;
      flex-direction: column;
    }
    .ingredients-strip {
      margin-bottom: 16px;
    }
    .ingredients-strip details {
      background: var(--secondary-background-color);
      border-radius: 12px;
      padding: 12px 16px;
    }
    .ingredients-strip summary {
      cursor: pointer;
      font-weight: 500;
      display: flex;
      justify-content: space-between;
    }
    .counter {
      color: var(--secondary-text-color);
      font-weight: 400;
      font-size: 0.9em;
    }
    .ingredients-strip ul {
      list-style: none;
      padding: 0;
      margin: 12px 0 0;
    }
    .ingredients-strip li {
      padding: 8px 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ingredients-strip li.checked {
      text-decoration: line-through;
      color: var(--secondary-text-color);
    }
    .ingredients-strip li ha-icon {
      color: var(--primary-color);
    }
    .step {
      flex: 1;
      padding: 24px 8px;
    }
    .step-meta {
      font-size: 0.9em;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .step-text {
      font-size: 1.5em;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    @media (max-width: 600px) {
      .step-text {
        font-size: 1.25em;
      }
    }
    .timer-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--primary-color);
      color: var(--text-primary-color);
      border: 0;
      border-radius: 12px;
      padding: 12px 20px;
      cursor: pointer;
      font-family: inherit;
      font-size: 1em;
    }
    .progress {
      height: 4px;
      background: var(--divider-color);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .progress .bar {
      height: 100%;
      background: var(--primary-color);
      transition: width 0.3s;
    }
    .nav {
      display: flex;
      gap: 12px;
    }
    .nav-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-family: inherit;
      font-size: 1.1em;
    }
    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .nav-btn.primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .wake-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      color: var(--accent-color, var(--primary-color));
      opacity: 0.6;
      pointer-events: none;
    }
    .loading {
      padding: 48px;
      text-align: center;
    }
  `,e([he({attribute:!1})],ye.prototype,"hass",void 0),e([he({attribute:!1})],ye.prototype,"recipe",void 0),e([he()],ye.prototype,"slug",void 0),e([he({attribute:!1})],ye.prototype,"api",void 0),e([ge()],ye.prototype,"_stepIndex",void 0),e([ge()],ye.prototype,"_checked",void 0),e([ge()],ye.prototype,"_wakeLockHeld",void 0),ye=e([le("recipe-box-cook-view")],ye);let $e=class extends ne{constructor(){super(...arguments),this.existingTags=[],this._stage="url",this._inputMode="url",this._url="",this._pastedText="",this._editedSlug="",this._editedTags=[],this._editedNotes="",this._conflictMode="new_copy",this._busy=!1,this._fileType=null,this._fileB64="",this._fileOriginalName="",this._filePreviewUrl="",this._fileRecipeName="",this._fileTags=[],this._fileNotes=""}disconnectedCallback(){super.disconnectedCallback(),this._filePreviewUrl&&URL.revokeObjectURL(this._filePreviewUrl)}async _runPreview(){if(!this.api)return;const e=this._url.trim();if("text"===this._inputMode||e)if("text"!==this._inputMode||this._pastedText.trim()){this._stage="loading",this._error=void 0;try{const t=await this.api.preview(e,void 0,"text"===this._inputMode?this._pastedText:void 0);this._preview=t,this._editedSlug=t.recipe._recipebox.suggested_slug,this._editedTags=[...t.recipe._recipebox.tags||[]],this._editedNotes=t.recipe._recipebox.notes||"",this._conflictMode=t.conflicts.slug_taken?"new_copy":"error",this._stage="review"}catch(e){this._error=be(e),this._stage="url"}}else this._error="Paste the recipe text.";else this._error="URL is required."}async _save(){if(this.api&&this._preview){this._busy=!0;try{const e={...this._preview.recipe,_recipebox:{...this._preview.recipe._recipebox,tags:this._editedTags,notes:this._editedNotes}},t=await this.api.save(e,{slug:this._editedSlug,on_conflict:this._conflictMode});this.dispatchEvent(new CustomEvent("import-complete",{detail:{slug:t.slug},bubbles:!0,composed:!0}))}catch(e){this._error=be(e)}finally{this._busy=!1}}}_addTag(e){const t=e.trim().toLowerCase();t&&!this._editedTags.includes(t)&&(this._editedTags=[...this._editedTags,t])}_removeTag(e){this._editedTags=this._editedTags.filter(t=>t!==e)}render(){return"url"===this._stage||"loading"===this._stage||"file-uploading"===this._stage?this._renderUrlStage():this._renderReviewStage()}_renderUrlStage(){return F`
      <div class="url-stage">
        <p class="hint">
          Paste a recipe URL. The integration will strip the fluff and
          show you a clean preview before saving.
        </p>

        <div class="mode-toggle">
          <button
            class=${"url"===this._inputMode?"active":""}
            @click=${()=>this._inputMode="url"}
            ?disabled=${"loading"===this._stage}
          >
            <ha-icon icon="mdi:link"></ha-icon> URL
          </button>
          <button
            class=${"text"===this._inputMode?"active":""}
            @click=${()=>this._inputMode="text"}
            ?disabled=${"loading"===this._stage}
          >
            <ha-icon icon="mdi:content-paste"></ha-icon> Paste text
          </button>
          <button
            class=${"file"===this._inputMode?"active":""}
            @click=${()=>this._inputMode="file"}
            ?disabled=${"loading"===this._stage}
          >
            <ha-icon icon="mdi:file-upload"></ha-icon> PDF / Photo
          </button>
        </div>

        ${"file"===this._inputMode?this._renderFileMode():"text"===this._inputMode?this._renderTextMode():this._renderUrlMode()}

        ${this._error?F`<div class="error">
              <ha-icon icon="mdi:alert-circle"></ha-icon> ${this._error}
            </div>`:W}
      </div>
    `}_renderUrlMode(){return F`
        <div class="url-row">
          <input
            type="url"
            placeholder="https://..."
            .value=${this._url}
            @input=${e=>this._url=e.target.value}
            @keydown=${e=>{"Enter"===e.key&&this._runPreview()}}
            ?disabled=${"loading"===this._stage}
          />
          <button
            class="primary"
            ?disabled=${"loading"===this._stage||!this._url.trim()}
            @click=${this._runPreview}
          >
            ${"loading"===this._stage?"Parsing...":"Preview"}
          </button>
        </div>
    `}_renderTextMode(){return F`
      <p class="paste-hint">
        For Cloudflare-blocked sites: open the recipe in your browser,
        select the recipe content (title through directions), copy, paste
        below. The parser looks for headers like
        <code>Ingredients</code> and <code>Directions</code> to find the
        sections. URL is optional — leave blank or include for reference.
      </p>
      <div class="url-row">
        <input
          type="url"
          placeholder="Source URL (optional)"
          .value=${this._url}
          @input=${e=>this._url=e.target.value}
          ?disabled=${"loading"===this._stage}
        />
      </div>
      <textarea
        class="html-paste"
        rows="14"
        placeholder="Paste recipe content here...

Example:
My Best Cookies
Total: 30 min
Serves: 24

Ingredients
2 1/4 cups flour
1 cup butter
...

Directions
Preheat oven to 375F
Mix ingredients
..."
        .value=${this._pastedText}
        @input=${e=>this._pastedText=e.target.value}
        ?disabled=${"loading"===this._stage}
      ></textarea>
      <div class="paste-actions">
        <span class="byte-count">
          ${this._pastedText.length.toLocaleString()} chars
        </span>
        <button
          class="primary"
          ?disabled=${"loading"===this._stage||!this._pastedText.trim()}
          @click=${this._runPreview}
        >
          ${"loading"===this._stage?"Parsing...":"Preview"}
        </button>
      </div>
    `}_renderFileMode(){const e="file-uploading"===this._stage;return F`
      <p class="paste-hint">
        Upload a PDF or a photo of a printed recipe. The file is stored
        alongside the recipe and shown inline. You can transcribe the
        ingredients/instructions later via the Edit button if you want
        them searchable, or just leave them empty and use the photo as the
        canonical reference.
      </p>

      ${this._fileB64?F`
            <div class="file-preview">
              ${"image"===this._fileType&&this._filePreviewUrl?F`<img src=${this._filePreviewUrl} alt="preview" />`:F`
                    <div class="file-preview-pdf">
                      <ha-icon icon="mdi:file-pdf-box"></ha-icon>
                      <div>
                        <div>${this._fileOriginalName}</div>
                        <div class="muted">
                          ${(.75*this._fileB64.length/1024).toFixed(0)} KB
                        </div>
                      </div>
                    </div>
                  `}
              <button
                class="text-btn"
                @click=${this._clearFile}
                ?disabled=${e}
              >
                <ha-icon icon="mdi:close"></ha-icon> Remove
              </button>
            </div>

            <div class="field">
              <label>Recipe name</label>
              <input
                type="text"
                .value=${this._fileRecipeName}
                placeholder="e.g. Grandma's Meatloaf"
                @input=${e=>this._fileRecipeName=e.target.value}
              />
            </div>

            <div class="field">
              <label>Tags</label>
              <div class="tag-editor">
                ${this._fileTags.map(e=>F`<span class="tag-chip">
                    ${e}
                    <button
                      @click=${()=>this._removeFileTag(e)}
                      title="Remove"
                    >
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </span>`)}
                <input
                  type="text"
                  placeholder="Add tag..."
                  @keydown=${e=>{if("Enter"===e.key){const t=e.target;this._addFileTag(t.value),t.value=""}}}
                />
              </div>
              ${this.existingTags.length?F`<div class="tag-suggestions">
                    ${this.existingTags.filter(e=>!this._fileTags.includes(e)).slice(0,8).map(e=>F`<button
                          class="suggestion"
                          @click=${()=>this._addFileTag(e)}
                        >
                          + ${e}
                        </button>`)}
                  </div>`:W}
            </div>

            <div class="field">
              <label>Notes</label>
              <textarea
                rows="2"
                placeholder="Optional notes..."
                .value=${this._fileNotes}
                @input=${e=>this._fileNotes=e.target.value}
              ></textarea>
            </div>

            <div class="paste-actions">
              <span class="byte-count"></span>
              <button
                class="primary"
                ?disabled=${e||!this._fileRecipeName.trim()}
                @click=${this._uploadFile}
              >
                ${e?"Uploading...":"Save recipe"}
              </button>
            </div>
          `:F`
            <label class="file-drop">
              <input
                type="file"
                accept=".pdf,image/*"
                @change=${this._onFileSelected}
                hidden
              />
              <ha-icon icon="mdi:file-upload-outline"></ha-icon>
              <div>
                <strong>Choose a file</strong>
                <span class="muted">or drag here — PDF or image</span>
              </div>
            </label>
          `}
    `}_onFileSelected(e){const t=e.target,i=t.files?.[0];if(!i)return;if(i.size>10485760)return void(this._error="File too large (max 10MB).");const o="application/pdf"===i.type||/\.pdf$/i.test(i.name),r=i.type.startsWith("image/");if(!o&&!r)return void(this._error="Only PDF or image files are supported.");this._fileType=o?"pdf":"image",this._fileOriginalName=i.name,this._fileRecipeName=i.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," ").replace(/\b\w/g,e=>e.toUpperCase()),this._error=void 0,this._filePreviewUrl&&URL.revokeObjectURL(this._filePreviewUrl),this._filePreviewUrl=r?URL.createObjectURL(i):"";const s=new FileReader;s.onload=()=>{const e=s.result,t=e.indexOf(",");this._fileB64=t>=0?e.slice(t+1):""},s.onerror=()=>{this._error="Failed to read file."},s.readAsDataURL(i)}_addFileTag(e){const t=e.trim().toLowerCase();t&&!this._fileTags.includes(t)&&(this._fileTags=[...this._fileTags,t])}_removeFileTag(e){this._fileTags=this._fileTags.filter(t=>t!==e)}_clearFile(){this._filePreviewUrl&&URL.revokeObjectURL(this._filePreviewUrl),this._fileType=null,this._fileOriginalName="",this._fileB64="",this._filePreviewUrl="",this._fileRecipeName="",this._fileTags=[],this._fileNotes=""}async _uploadFile(){if(!this.api||!this._fileB64||!this._fileType)return;const e=this._fileRecipeName.trim();if(e){this._stage="file-uploading",this._error=void 0;try{const t=await this.api.uploadFile({name:e,file_b64:this._fileB64,file_type:this._fileType,filename:this._fileOriginalName,tags:this._fileTags,notes:this._fileNotes,on_conflict:"new_copy"});this.dispatchEvent(new CustomEvent("import-complete",{detail:{slug:t.slug},bubbles:!0,composed:!0}))}catch(e){this._error=be(e),this._stage="url"}}else this._error="Recipe name is required."}_renderReviewStage(){const e=this._preview.recipe,t=this._preview.conflicts,i=!!t.slug_taken||!!t.url_already_imported;return F`
      <div class="review">
        ${e.image?F`<div class="hero" style="background-image: url('${e.image}')"></div>`:W}

        <div class="content">
          <h2>${e.name}</h2>
          ${e.description?F`<p class="description">${e.description}</p>`:W}

          <div class="stats">
            <span>${e.recipeIngredient.length} ingredients</span>
            <span>•</span>
            <span>${e.recipeInstructions.length} steps</span>
            ${e.recipeYield?F`<span>•</span><span>${e.recipeYield}</span>`:W}
            <span>•</span>
            <span class="source">from ${e._recipebox.source_host}</span>
          </div>

          ${i?this._renderConflict():W}

          <div class="field">
            <label>Slug</label>
            <input
              type="text"
              .value=${this._editedSlug}
              @input=${e=>this._editedSlug=e.target.value.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")||"recipe"}
            />
            <span class="field-hint">
              Folder name. Will be saved as <code>${this._editedSlug}/recipe.json</code>
            </span>
          </div>

          <div class="field">
            <label>Tags</label>
            <div class="tag-editor">
              ${this._editedTags.map(e=>F`<span class="tag-chip">
                  ${e}
                  <button @click=${()=>this._removeTag(e)} title="Remove tag">
                    <ha-icon icon="mdi:close"></ha-icon>
                  </button>
                </span>`)}
              <input
                type="text"
                placeholder="Add tag..."
                @keydown=${e=>{if("Enter"===e.key){const t=e.target;this._addTag(t.value),t.value=""}}}
              />
            </div>
            ${this.existingTags.length?F`<div class="tag-suggestions">
                  ${this.existingTags.filter(e=>!this._editedTags.includes(e)).slice(0,8).map(e=>F`<button class="suggestion" @click=${()=>this._addTag(e)}>
                        + ${e}
                      </button>`)}
                </div>`:W}
          </div>

          <div class="field">
            <label>Notes</label>
            <textarea
              rows="3"
              placeholder="Optional notes..."
              .value=${this._editedNotes}
              @input=${e=>this._editedNotes=e.target.value}
            ></textarea>
          </div>

          <details class="preview-details">
            <summary>Preview parsed content (${e.recipeIngredient.length} ingredients, ${e.recipeInstructions.length} steps)</summary>
            <h4>Ingredients</h4>
            <ul>
              ${e.recipeIngredient.map(e=>F`<li>${e}</li>`)}
            </ul>
            <h4>Instructions</h4>
            <ol>
              ${e.recipeInstructions.map(e=>F`<li>${e.text}</li>`)}
            </ol>
          </details>

          ${this._error?F`<div class="error">
                <ha-icon icon="mdi:alert-circle"></ha-icon> ${this._error}
              </div>`:W}

          <div class="actions">
            <button @click=${()=>this._stage="url"}>← Back</button>
            <button
              class="primary"
              ?disabled=${this._busy||!this._editedSlug}
              @click=${this._save}
            >
              ${this._busy?"Saving...":"Save recipe"}
            </button>
          </div>
        </div>
      </div>
    `}_renderConflict(){const e=this._preview.conflicts,t=e.url_already_imported?`You've already imported this URL as "${e.url_already_imported}".`:`A recipe at slug "${e.slug_taken}" already exists.`;return F`
      <div class="conflict">
        <div class="conflict-header">
          <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
          <span>${t}</span>
        </div>
        <div class="conflict-options">
          <label>
            <input
              type="radio"
              name="conflict"
              value="new_copy"
              .checked=${"new_copy"===this._conflictMode}
              @change=${()=>this._conflictMode="new_copy"}
            />
            <div>
              <strong>Save as new copy</strong>
              <span>Adds a numeric suffix (e.g. <code>${e.slug_taken}-2</code>)</span>
            </div>
          </label>
          <label>
            <input
              type="radio"
              name="conflict"
              value="overwrite"
              .checked=${"overwrite"===this._conflictMode}
              @change=${()=>this._conflictMode="overwrite"}
            />
            <div>
              <strong>Overwrite existing</strong>
              <span>Refresh content; preserves your tags, notes, and cook history</span>
            </div>
          </label>
        </div>
      </div>
    `}};$e.styles=a`
    :host {
      display: block;
      font-size: var(--recipe-box-base-font-size, 14px);
      line-height: 1.4;
    }
    .url-stage {
      padding: 32px 16px;
      max-width: 700px;
      margin: 0 auto;
    }
    .hint {
      color: var(--secondary-text-color);
      margin-bottom: 16px;
    }
    .mode-toggle {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      background: var(--secondary-background-color);
      padding: 4px;
      border-radius: 10px;
      width: fit-content;
    }
    .mode-toggle button {
      background: transparent;
      border: 0;
      color: var(--secondary-text-color);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.9em;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .mode-toggle button.active {
      background: var(--card-background-color);
      color: var(--primary-text-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .paste-hint {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      margin: 12px 0 8px;
      line-height: 1.5;
    }
    .paste-hint code {
      background: var(--secondary-background-color);
      padding: 1px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
    .html-paste {
      width: 100%;
      box-sizing: border-box;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: monospace;
      font-size: 0.85em;
      resize: vertical;
    }
    .paste-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .byte-count {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      margin-right: auto;
    }
    .url-row {
      display: flex;
      gap: 8px;
    }
    .url-row input {
      flex: 1;
      padding: 12px 16px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 1em;
    }
    .url-row button,
    .actions button {
      padding: 12px 20px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      cursor: pointer;
      font-family: inherit;
      font-size: 1em;
    }
    .url-row .primary,
    .actions .primary {
      background: var(--primary-color);
      color: var(--text-primary-color);
      border-color: var(--primary-color);
    }
    .url-row button:disabled,
    .actions button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .review .hero {
      aspect-ratio: 16 / 9;
      background-size: cover;
      background-position: center;
    }
    .review .content {
      padding: 16px;
    }
    .review h2 {
      margin: 0 0 8px;
    }
    .description {
      color: var(--secondary-text-color);
      font-style: italic;
      margin: 0 0 16px;
    }
    .stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-bottom: 24px;
    }
    .conflict {
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .conflict-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      margin-bottom: 12px;
      color: var(--warning-color, #f59e0b);
    }
    .conflict-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .conflict-options label {
      display: flex;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      align-items: flex-start;
    }
    .conflict-options label:hover {
      background: var(--secondary-background-color);
    }
    .conflict-options label > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .conflict-options span {
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }
    .field {
      margin-bottom: 20px;
    }
    .field label {
      display: block;
      font-weight: 500;
      margin-bottom: 6px;
    }
    .field input,
    .field textarea {
      width: 100%;
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-family: inherit;
      font-size: 1em;
      box-sizing: border-box;
    }
    .field-hint {
      display: block;
      margin-top: 4px;
      font-size: 0.8em;
      color: var(--secondary-text-color);
    }
    .field-hint code {
      background: var(--secondary-background-color);
      padding: 1px 6px;
      border-radius: 3px;
    }
    .tag-editor {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px;
      border-radius: 8px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
    }
    .tag-editor input {
      flex: 1;
      min-width: 120px;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--primary-text-color);
    }
    .tag-chip {
      background: var(--primary-color);
      color: var(--text-primary-color);
      padding: 2px 4px 2px 10px;
      border-radius: 999px;
      font-size: 0.85em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .tag-chip button {
      background: transparent;
      border: 0;
      color: inherit;
      cursor: pointer;
      padding: 2px;
      border-radius: 50%;
      display: inline-flex;
    }
    .tag-chip button:hover {
      background: rgba(255, 255, 255, 0.2);
    }
    .tag-chip ha-icon {
      --mdc-icon-size: 14px;
    }
    .tag-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
    }
    .suggestion {
      background: transparent;
      border: 1px dashed var(--divider-color);
      color: var(--secondary-text-color);
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 0.8em;
      cursor: pointer;
      font-family: inherit;
    }
    .preview-details {
      margin: 24px 0;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--secondary-background-color);
    }
    .preview-details summary {
      cursor: pointer;
      font-weight: 500;
    }
    .preview-details h4 {
      margin: 16px 0 8px;
    }
    .preview-details ul,
    .preview-details ol {
      padding-left: 20px;
      margin: 0;
    }
    .preview-details li {
      padding: 4px 0;
      line-height: 1.5;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
    }
    .error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      border-radius: 8px;
      background: rgba(244, 67, 54, 0.1);
      color: var(--error-color);
      margin-top: 12px;
    }

    /* ---- File upload mode ---- */
    .file-drop {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px 20px;
      border: 2px dashed var(--divider-color);
      border-radius: 12px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      text-align: center;
    }
    .file-drop:hover {
      border-color: var(--primary-color);
      background: var(--secondary-background-color);
    }
    .file-drop ha-icon {
      --mdc-icon-size: 48px;
      color: var(--secondary-text-color);
    }
    .file-drop strong {
      display: block;
    }
    .file-drop .muted {
      display: block;
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-top: 2px;
    }
    .file-preview {
      position: relative;
      margin-bottom: 16px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--secondary-background-color);
    }
    .file-preview img {
      display: block;
      width: 100%;
      max-height: 320px;
      object-fit: contain;
    }
    .file-preview-pdf {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 16px;
    }
    .file-preview-pdf ha-icon {
      --mdc-icon-size: 40px;
      color: var(--error-color);
    }
    .file-preview-pdf .muted {
      color: var(--secondary-text-color);
      font-size: 0.85em;
    }
    .file-preview .text-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: 0;
      padding: 4px 10px;
      border-radius: 999px;
      cursor: pointer;
      font-size: 0.8em;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-family: inherit;
    }
    .file-preview .text-btn ha-icon {
      --mdc-icon-size: 14px;
    }
  `,e([he({attribute:!1})],$e.prototype,"api",void 0),e([he({type:Array})],$e.prototype,"existingTags",void 0),e([ge()],$e.prototype,"_stage",void 0),e([ge()],$e.prototype,"_inputMode",void 0),e([ge()],$e.prototype,"_url",void 0),e([ge()],$e.prototype,"_pastedText",void 0),e([ge()],$e.prototype,"_preview",void 0),e([ge()],$e.prototype,"_editedSlug",void 0),e([ge()],$e.prototype,"_editedTags",void 0),e([ge()],$e.prototype,"_editedNotes",void 0),e([ge()],$e.prototype,"_conflictMode",void 0),e([ge()],$e.prototype,"_busy",void 0),e([ge()],$e.prototype,"_error",void 0),e([ge()],$e.prototype,"_fileType",void 0),e([ge()],$e.prototype,"_fileB64",void 0),e([ge()],$e.prototype,"_fileOriginalName",void 0),e([ge()],$e.prototype,"_filePreviewUrl",void 0),e([ge()],$e.prototype,"_fileRecipeName",void 0),e([ge()],$e.prototype,"_fileTags",void 0),e([ge()],$e.prototype,"_fileNotes",void 0),$e=e([le("recipe-box-import-view")],$e);let ke=class extends ne{constructor(){super(...arguments),this._view="library",this._library=[],this._loading=!1}setConfig(e){if(!e)throw new Error("Invalid configuration");this._config=e,this._view=e.view||"library"}getCardSize(){return 8}static getStubConfig(){return{type:"custom:recipe-box-card",view:"library"}}willUpdate(e){this.hass&&!this._api&&(this._api=new fe(this.hass),this._loadLibrary()),e.has("_config")&&this._config?.recipe_id&&this._config.recipe_id!==this._activeSlug&&this._loadRecipe(this._config.recipe_id)}async _loadLibrary(){if(this._api){this._loading=!0;try{this._library=await this._api.list(),this._error=void 0}catch(e){this._error=String(e)}finally{this._loading=!1}}}async _loadRecipe(e){if(this._api){this._loading=!0;try{this._activeRecipe=await this._api.get(e),this._activeSlug=e,this._error=void 0}catch(e){this._error=String(e)}finally{this._loading=!1}}}_onSelectRecipe(e){this._loadRecipe(e.detail.slug).then(()=>{this._view="detail"})}_onStartCooking(){this._activeRecipe&&(this._view="cook")}_onBack(){this._view="library",this._activeRecipe=void 0,this._activeSlug=void 0}_onShowImport(){this._view="import"}_onImportComplete(e){this._loadLibrary(),this._loadRecipe(e.detail.slug).then(()=>this._view="detail")}render(){return this._config?this._error?F`<ha-card class="error">
        <div class="error-content">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <div>${this._error}</div>
          <button @click=${()=>{this._error=void 0,this._loadLibrary()}}>
            Retry
          </button>
        </div>
      </ha-card>`:F`
      <ha-card>
        ${this._renderHeader()}
        ${this._renderView()}
      </ha-card>
    `:F`<ha-card>Configuration error</ha-card>`}_renderHeader(){if("library"===this._view){const e=this._config?.title??"Recipes";return F`
        <div class="card-header">
          <span class="title">${e}</span>
          <button class="add-btn" @click=${this._onShowImport}>
            <ha-icon icon="mdi:plus"></ha-icon> Add
          </button>
        </div>
      `}const e="import"===this._view?"Import recipe":this._activeRecipe?.name??"";return F`
      <div class="card-header">
        <button class="back-btn" @click=${this._onBack}>
          <ha-icon icon="mdi:arrow-left"></ha-icon>
        </button>
        <span class="title">${e}</span>
      </div>
    `}_renderView(){if(this._loading)return F`<div class="loading"><ha-circular-progress active></ha-circular-progress></div>`;switch(this._view){case"library":return F`<recipe-box-library-view
          .recipes=${this._library}
          .columns=${this._config?.columns??3}
          .showFilters=${this._config?.show_filters??!1}
          .groupBy=${this._config?.group_by??"none"}
          @recipe-selected=${this._onSelectRecipe}
        ></recipe-box-library-view>`;case"detail":return F`<recipe-box-detail-view
          .hass=${this.hass}
          .recipe=${this._activeRecipe}
          .slug=${this._activeSlug??""}
          .defaultTodo=${this._config?.default_todo}
          .api=${this._api}
          @start-cooking=${this._onStartCooking}
          @recipe-deleted=${this._onBack}
        ></recipe-box-detail-view>`;case"cook":return F`<recipe-box-cook-view
          .hass=${this.hass}
          .recipe=${this._activeRecipe}
          .slug=${this._activeSlug??""}
          .api=${this._api}
        ></recipe-box-cook-view>`;case"import":return F`<recipe-box-import-view
          .api=${this._api}
          .existingTags=${this._library.flatMap(e=>e.tags)}
          @import-complete=${this._onImportComplete}
        ></recipe-box-import-view>`}}};ke.styles=a`
    :host {
      display: block;
      /* Anchor base font-size in pixels so Android system font-scale
         and inherited dashboard sizes don't inflate everything inside
         the card. Override with --recipe-box-base-font-size if needed. */
      font-size: var(--recipe-box-base-font-size, 14px);
      line-height: 1.4;
    }
    ha-card {
      overflow: hidden;
      /* Don't impose a minimum height — let content drive size. */
      min-height: auto;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color);
    }
    .card-header .title {
      flex: 1;
      font-size: 1.4em;
      font-weight: 500;
    }
    .card-header button {
      background: transparent;
      border: 0;
      cursor: pointer;
      color: var(--primary-text-color);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.95em;
    }
    .card-header button:hover {
      background: var(--secondary-background-color);
    }
    .card-header .add-btn {
      background: var(--primary-color);
      color: var(--text-primary-color);
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    ha-card.error {
      padding: 24px;
    }
    .error-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: var(--error-color);
    }
  `,e([he({attribute:!1})],ke.prototype,"hass",void 0),e([ge()],ke.prototype,"_config",void 0),e([ge()],ke.prototype,"_view",void 0),e([ge()],ke.prototype,"_activeRecipe",void 0),e([ge()],ke.prototype,"_activeSlug",void 0),e([ge()],ke.prototype,"_library",void 0),e([ge()],ke.prototype,"_loading",void 0),e([ge()],ke.prototype,"_error",void 0),ke=e([le("recipe-box-card")],ke),window.customCards=window.customCards??[],window.customCards.push({type:"recipe-box-card",name:"Recipe Box",description:"Browse, import, and cook recipes from your Recipe Box."});export{ke as RecipeBoxCard};
//# sourceMappingURL=recipe-box-card.js.map
