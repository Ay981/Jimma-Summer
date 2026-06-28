(function(){"use strict";/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kt=()=>{};var Ee={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _e=function(e){const t=[];let n=0;for(let r=0;r<e.length;r++){let i=e.charCodeAt(r);i<128?t[n++]=i:i<2048?(t[n++]=i>>6|192,t[n++]=i&63|128):(i&64512)===55296&&r+1<e.length&&(e.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(e.charCodeAt(++r)&1023),t[n++]=i>>18|240,t[n++]=i>>12&63|128,t[n++]=i>>6&63|128,t[n++]=i&63|128):(t[n++]=i>>12|224,t[n++]=i>>6&63|128,t[n++]=i&63|128)}return t},Rt=function(e){const t=[];let n=0,r=0;for(;n<e.length;){const i=e[n++];if(i<128)t[r++]=String.fromCharCode(i);else if(i>191&&i<224){const o=e[n++];t[r++]=String.fromCharCode((i&31)<<6|o&63)}else if(i>239&&i<365){const o=e[n++],s=e[n++],c=e[n++],u=((i&7)<<18|(o&63)<<12|(s&63)<<6|c&63)-65536;t[r++]=String.fromCharCode(55296+(u>>10)),t[r++]=String.fromCharCode(56320+(u&1023))}else{const o=e[n++],s=e[n++];t[r++]=String.fromCharCode((i&15)<<12|(o&63)<<6|s&63)}}return t.join("")},Se={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(e,t){if(!Array.isArray(e))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=t?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<e.length;i+=3){const o=e[i],s=i+1<e.length,c=s?e[i+1]:0,u=i+2<e.length,a=u?e[i+2]:0,B=o>>2,F=(o&3)<<4|c>>4;let K=(c&15)<<2|a>>6,q=a&63;u||(q=64,s||(K=64)),r.push(n[B],n[F],n[K],n[q])}return r.join("")},encodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?btoa(e):this.encodeByteArray(_e(e),t)},decodeString(e,t){return this.HAS_NATIVE_SUPPORT&&!t?atob(e):Rt(this.decodeStringToByteArray(e,t))},decodeStringToByteArray(e,t){this.init_();const n=t?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<e.length;){const o=n[e.charAt(i++)],c=i<e.length?n[e.charAt(i)]:0;++i;const a=i<e.length?n[e.charAt(i)]:64;++i;const F=i<e.length?n[e.charAt(i)]:64;if(++i,o==null||c==null||a==null||F==null)throw new Ot;const K=o<<2|c>>4;if(r.push(K),a!==64){const q=c<<4&240|a>>2;if(r.push(q),F!==64){const oo=a<<6&192|F;r.push(oo)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let e=0;e<this.ENCODED_VALS.length;e++)this.byteToCharMap_[e]=this.ENCODED_VALS.charAt(e),this.charToByteMap_[this.byteToCharMap_[e]]=e,this.byteToCharMapWebSafe_[e]=this.ENCODED_VALS_WEBSAFE.charAt(e),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[e]]=e,e>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(e)]=e,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(e)]=e)}}};class Ot extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const Mt=function(e){const t=_e(e);return Se.encodeByteArray(t,!0)},Te=function(e){return Mt(e).replace(/\./g,"")},Nt=function(e){try{return Se.decodeString(e,!0)}catch(t){console.error("base64Decode failed: ",t)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Bt(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ft=()=>Bt().__FIREBASE_DEFAULTS__,$t=()=>{if(typeof process>"u"||typeof Ee>"u")return;const e=Ee.__FIREBASE_DEFAULTS__;if(e)return JSON.parse(e)},Lt=()=>{if(typeof document>"u")return;let e;try{e=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const t=e&&Nt(e[1]);return t&&JSON.parse(t)},Pt=()=>{try{return kt()||Ft()||$t()||Lt()}catch(e){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${e}`);return}},Ae=()=>{var e;return(e=Pt())==null?void 0:e.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xt{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((t,n)=>{this.resolve=t,this.reject=n})}wrapCallback(t){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof t=="function"&&(this.promise.catch(()=>{}),t.length===1?t(n):t(n,r))}}}function De(){try{return typeof indexedDB=="object"}catch{return!1}}function Ce(){return new Promise((e,t)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(r),e(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{var o;t(((o=i.error)==null?void 0:o.message)||"")}}catch(n){t(n)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ht="FirebaseError";class S extends Error{constructor(t,n,r){super(n),this.code=t,this.customData=r,this.name=Ht,Object.setPrototypeOf(this,S.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,$.prototype.create)}}class ${constructor(t,n,r){this.service=t,this.serviceName=n,this.errors=r}create(t,...n){const r=n[0]||{},i=`${this.service}/${t}`,o=this.errors[t],s=o?jt(o,r):"Error",c=`${this.serviceName}: ${s} (${i}).`;return new S(i,c,r)}}function jt(e,t){return e.replace(Ut,(n,r)=>{const i=t[r];return i!=null?String(i):`<${r}?>`})}const Ut=/\{\$([^}]+)}/g;function W(e,t){if(e===t)return!0;const n=Object.keys(e),r=Object.keys(t);for(const i of n){if(!r.includes(i))return!1;const o=e[i],s=t[i];if(ve(o)&&ve(s)){if(!W(o,s))return!1}else if(o!==s)return!1}for(const i of r)if(!n.includes(i))return!1;return!0}function ve(e){return e!==null&&typeof e=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ke(e){return e&&e._delegate?e._delegate:e}class w{constructor(t,n,r){this.name=t,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(t){return this.instantiationMode=t,this}setMultipleInstances(t){return this.multipleInstances=t,this}setServiceProps(t){return this.serviceProps=t,this}setInstanceCreatedCallback(t){return this.onInstanceCreated=t,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const y="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vt{constructor(t,n){this.name=t,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(t){const n=this.normalizeInstanceIdentifier(t);if(!this.instancesDeferred.has(n)){const r=new xt;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:n});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(t){const n=this.normalizeInstanceIdentifier(t==null?void 0:t.identifier),r=(t==null?void 0:t.optional)??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(i){if(r)return null;throw i}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(t){if(t.name!==this.name)throw Error(`Mismatching Component ${t.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=t,!!this.shouldAutoInitialize()){if(qt(t))try{this.getOrInitializeService({instanceIdentifier:y})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(n);try{const o=this.getOrInitializeService({instanceIdentifier:i});r.resolve(o)}catch{}}}}clearInstance(t=y){this.instancesDeferred.delete(t),this.instancesOptions.delete(t),this.instances.delete(t)}async delete(){const t=Array.from(this.instances.values());await Promise.all([...t.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...t.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(t=y){return this.instances.has(t)}getOptions(t=y){return this.instancesOptions.get(t)||{}}initialize(t={}){const{options:n={}}=t,r=this.normalizeInstanceIdentifier(t.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[o,s]of this.instancesDeferred.entries()){const c=this.normalizeInstanceIdentifier(o);r===c&&s.resolve(i)}return i}onInit(t,n){const r=this.normalizeInstanceIdentifier(n),i=this.onInitCallbacks.get(r)??new Set;i.add(t),this.onInitCallbacks.set(r,i);const o=this.instances.get(r);return o&&t(o,r),()=>{i.delete(t)}}invokeOnInitCallbacks(t,n){const r=this.onInitCallbacks.get(n);if(r)for(const i of r)try{i(t,n)}catch{}}getOrInitializeService({instanceIdentifier:t,options:n={}}){let r=this.instances.get(t);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:Kt(t),options:n}),this.instances.set(t,r),this.instancesOptions.set(t,n),this.invokeOnInitCallbacks(r,t),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,t,r)}catch{}return r||null}normalizeInstanceIdentifier(t=y){return this.component?this.component.multipleInstances?t:y:t}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Kt(e){return e===y?void 0:e}function qt(e){return e.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Wt{constructor(t){this.name=t,this.providers=new Map}addComponent(t){const n=this.getProvider(t.name);if(n.isComponentSet())throw new Error(`Component ${t.name} has already been registered with ${this.name}`);n.setComponent(t)}addOrOverwriteComponent(t){this.getProvider(t.name).isComponentSet()&&this.providers.delete(t.name),this.addComponent(t)}getProvider(t){if(this.providers.has(t))return this.providers.get(t);const n=new Vt(t,this);return this.providers.set(t,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var d;(function(e){e[e.DEBUG=0]="DEBUG",e[e.VERBOSE=1]="VERBOSE",e[e.INFO=2]="INFO",e[e.WARN=3]="WARN",e[e.ERROR=4]="ERROR",e[e.SILENT=5]="SILENT"})(d||(d={}));const Gt={debug:d.DEBUG,verbose:d.VERBOSE,info:d.INFO,warn:d.WARN,error:d.ERROR,silent:d.SILENT},zt=d.INFO,Jt={[d.DEBUG]:"log",[d.VERBOSE]:"log",[d.INFO]:"info",[d.WARN]:"warn",[d.ERROR]:"error"},Qt=(e,t,...n)=>{if(t<e.logLevel)return;const r=new Date().toISOString(),i=Jt[t];if(i)console[i](`[${r}]  ${e.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${t})`)};class Yt{constructor(t){this.name=t,this._logLevel=zt,this._logHandler=Qt,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(t){if(!(t in d))throw new TypeError(`Invalid value "${t}" assigned to \`logLevel\``);this._logLevel=t}setLogLevel(t){this._logLevel=typeof t=="string"?Gt[t]:t}get logHandler(){return this._logHandler}set logHandler(t){if(typeof t!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=t}get userLogHandler(){return this._userLogHandler}set userLogHandler(t){this._userLogHandler=t}debug(...t){this._userLogHandler&&this._userLogHandler(this,d.DEBUG,...t),this._logHandler(this,d.DEBUG,...t)}log(...t){this._userLogHandler&&this._userLogHandler(this,d.VERBOSE,...t),this._logHandler(this,d.VERBOSE,...t)}info(...t){this._userLogHandler&&this._userLogHandler(this,d.INFO,...t),this._logHandler(this,d.INFO,...t)}warn(...t){this._userLogHandler&&this._userLogHandler(this,d.WARN,...t),this._logHandler(this,d.WARN,...t)}error(...t){this._userLogHandler&&this._userLogHandler(this,d.ERROR,...t),this._logHandler(this,d.ERROR,...t)}}const Xt=(e,t)=>t.some(n=>e instanceof n);let Re,Oe;function Zt(){return Re||(Re=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function en(){return Oe||(Oe=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Me=new WeakMap,G=new WeakMap,Ne=new WeakMap,z=new WeakMap,J=new WeakMap;function tn(e){const t=new Promise((n,r)=>{const i=()=>{e.removeEventListener("success",o),e.removeEventListener("error",s)},o=()=>{n(p(e.result)),i()},s=()=>{r(e.error),i()};e.addEventListener("success",o),e.addEventListener("error",s)});return t.then(n=>{n instanceof IDBCursor&&Me.set(n,e)}).catch(()=>{}),J.set(t,e),t}function nn(e){if(G.has(e))return;const t=new Promise((n,r)=>{const i=()=>{e.removeEventListener("complete",o),e.removeEventListener("error",s),e.removeEventListener("abort",s)},o=()=>{n(),i()},s=()=>{r(e.error||new DOMException("AbortError","AbortError")),i()};e.addEventListener("complete",o),e.addEventListener("error",s),e.addEventListener("abort",s)});G.set(e,t)}let Q={get(e,t,n){if(e instanceof IDBTransaction){if(t==="done")return G.get(e);if(t==="objectStoreNames")return e.objectStoreNames||Ne.get(e);if(t==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return p(e[t])},set(e,t,n){return e[t]=n,!0},has(e,t){return e instanceof IDBTransaction&&(t==="done"||t==="store")?!0:t in e}};function rn(e){Q=e(Q)}function on(e){return e===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(t,...n){const r=e.call(Y(this),t,...n);return Ne.set(r,t.sort?t.sort():[t]),p(r)}:en().includes(e)?function(...t){return e.apply(Y(this),t),p(Me.get(this))}:function(...t){return p(e.apply(Y(this),t))}}function sn(e){return typeof e=="function"?on(e):(e instanceof IDBTransaction&&nn(e),Xt(e,Zt())?new Proxy(e,Q):e)}function p(e){if(e instanceof IDBRequest)return tn(e);if(z.has(e))return z.get(e);const t=sn(e);return t!==e&&(z.set(e,t),J.set(t,e)),t}const Y=e=>J.get(e);function L(e,t,{blocked:n,upgrade:r,blocking:i,terminated:o}={}){const s=indexedDB.open(e,t),c=p(s);return r&&s.addEventListener("upgradeneeded",u=>{r(p(s.result),u.oldVersion,u.newVersion,p(s.transaction),u)}),n&&s.addEventListener("blocked",u=>n(u.oldVersion,u.newVersion,u)),c.then(u=>{o&&u.addEventListener("close",()=>o()),i&&u.addEventListener("versionchange",a=>i(a.oldVersion,a.newVersion,a))}).catch(()=>{}),c}function P(e,{blocked:t}={}){const n=indexedDB.deleteDatabase(e);return t&&n.addEventListener("blocked",r=>t(r.oldVersion,r)),p(n).then(()=>{})}const an=["get","getKey","getAll","getAllKeys","count"],cn=["put","add","delete","clear"],X=new Map;function Be(e,t){if(!(e instanceof IDBDatabase&&!(t in e)&&typeof t=="string"))return;if(X.get(t))return X.get(t);const n=t.replace(/FromIndex$/,""),r=t!==n,i=cn.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(i||an.includes(n)))return;const o=async function(s,...c){const u=this.transaction(s,i?"readwrite":"readonly");let a=u.store;return r&&(a=a.index(c.shift())),(await Promise.all([a[n](...c),i&&u.done]))[0]};return X.set(t,o),o}rn(e=>({...e,get:(t,n,r)=>Be(t,n)||e.get(t,n,r),has:(t,n)=>!!Be(t,n)||e.has(t,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class un{constructor(t){this.container=t}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(dn(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function dn(e){const t=e.getComponent();return(t==null?void 0:t.type)==="VERSION"}const Z="@firebase/app",Fe="0.15.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const g=new Yt("@firebase/app"),fn="@firebase/app-compat",ln="@firebase/analytics-compat",hn="@firebase/analytics",pn="@firebase/app-check-compat",gn="@firebase/app-check",bn="@firebase/auth",mn="@firebase/auth-compat",wn="@firebase/database",yn="@firebase/data-connect",In="@firebase/database-compat",En="@firebase/functions",_n="@firebase/functions-compat",Sn="@firebase/installations",Tn="@firebase/installations-compat",An="@firebase/messaging",Dn="@firebase/messaging-compat",Cn="@firebase/performance",vn="@firebase/performance-compat",kn="@firebase/remote-config",Rn="@firebase/remote-config-compat",On="@firebase/storage",Mn="@firebase/storage-compat",Nn="@firebase/firestore",Bn="@firebase/ai",Fn="@firebase/firestore-compat",$n="firebase";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ee="[DEFAULT]",Ln={[Z]:"fire-core",[fn]:"fire-core-compat",[hn]:"fire-analytics",[ln]:"fire-analytics-compat",[gn]:"fire-app-check",[pn]:"fire-app-check-compat",[bn]:"fire-auth",[mn]:"fire-auth-compat",[wn]:"fire-rtdb",[yn]:"fire-data-connect",[In]:"fire-rtdb-compat",[En]:"fire-fn",[_n]:"fire-fn-compat",[Sn]:"fire-iid",[Tn]:"fire-iid-compat",[An]:"fire-fcm",[Dn]:"fire-fcm-compat",[Cn]:"fire-perf",[vn]:"fire-perf-compat",[kn]:"fire-rc",[Rn]:"fire-rc-compat",[On]:"fire-gcs",[Mn]:"fire-gcs-compat",[Nn]:"fire-fst",[Fn]:"fire-fst-compat",[Bn]:"fire-vertex","fire-js":"fire-js",[$n]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const x=new Map,Pn=new Map,te=new Map;function $e(e,t){try{e.container.addComponent(t)}catch(n){g.debug(`Component ${t.name} failed to register with FirebaseApp ${e.name}`,n)}}function T(e){const t=e.name;if(te.has(t))return g.debug(`There were multiple attempts to register component ${t}.`),!1;te.set(t,e);for(const n of x.values())$e(n,e);for(const n of Pn.values())$e(n,e);return!0}function ne(e,t){const n=e.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),e.container.getProvider(t)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const xn={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},m=new $("app","Firebase",xn);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hn{constructor(t,n,r){this._isDeleted=!1,this._options={...t},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new w("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(t){this.checkDestroyed(),this._automaticDataCollectionEnabled=t}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(t){this._isDeleted=t}checkDestroyed(){if(this.isDeleted)throw m.create("app-deleted",{appName:this._name})}}function Le(e,t={}){let n=e;typeof t!="object"&&(t={name:t});const r={name:ee,automaticDataCollectionEnabled:!0,...t},i=r.name;if(typeof i!="string"||!i)throw m.create("bad-app-name",{appName:String(i)});if(n||(n=Ae()),!n)throw m.create("no-options");const o=x.get(i);if(o){if(W(n,o.options)&&W(r,o.config))return o;throw m.create("duplicate-app",{appName:i})}const s=new Wt(i);for(const u of te.values())s.addComponent(u);const c=new Hn(n,r,s);return x.set(i,c),c}function jn(e=ee){const t=x.get(e);if(!t&&e===ee&&Ae())return Le();if(!t)throw m.create("no-app",{appName:e});return t}function A(e,t,n){let r=Ln[e]??e;n&&(r+=`-${n}`);const i=r.match(/\s|\//),o=t.match(/\s|\//);if(i||o){const s=[`Unable to register library "${r}" with version "${t}":`];i&&s.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&o&&s.push("and"),o&&s.push(`version name "${t}" contains illegal characters (whitespace or "/")`),g.warn(s.join(" "));return}T(new w(`${r}-version`,()=>({library:r,version:t}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Un="firebase-heartbeat-database",Vn=1,k="firebase-heartbeat-store";let re=null;function Pe(){return re||(re=L(Un,Vn,{upgrade:(e,t)=>{switch(t){case 0:try{e.createObjectStore(k)}catch(n){console.warn(n)}}}}).catch(e=>{throw m.create("idb-open",{originalErrorMessage:e.message})})),re}async function Kn(e){try{const n=(await Pe()).transaction(k),r=await n.objectStore(k).get(He(e));return await n.done,r}catch(t){if(t instanceof S)g.warn(t.message);else{const n=m.create("idb-get",{originalErrorMessage:t==null?void 0:t.message});g.warn(n.message)}}}async function xe(e,t){try{const r=(await Pe()).transaction(k,"readwrite");await r.objectStore(k).put(t,He(e)),await r.done}catch(n){if(n instanceof S)g.warn(n.message);else{const r=m.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});g.warn(r.message)}}}function He(e){return`${e.name}!${e.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qn=1024,Wn=30;class Gn{constructor(t){this.container=t,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new Jn(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var t,n;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),o=je();if(((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===o||this._heartbeatsCache.heartbeats.some(s=>s.date===o))return;if(this._heartbeatsCache.heartbeats.push({date:o,agent:i}),this._heartbeatsCache.heartbeats.length>Wn){const s=Qn(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(s,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){g.warn(r)}}async getHeartbeatsHeader(){var t;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((t=this._heartbeatsCache)==null?void 0:t.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=je(),{heartbeatsToSend:r,unsentEntries:i}=zn(this._heartbeatsCache.heartbeats),o=Te(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),o}catch(n){return g.warn(n),""}}}function je(){return new Date().toISOString().substring(0,10)}function zn(e,t=qn){const n=[];let r=e.slice();for(const i of e){const o=n.find(s=>s.agent===i.agent);if(o){if(o.dates.push(i.date),Ue(n)>t){o.dates.pop();break}}else if(n.push({agent:i.agent,dates:[i.date]}),Ue(n)>t){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class Jn{constructor(t){this.app=t,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return De()?Ce().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await Kn(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return xe(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:t.heartbeats})}else return}async add(t){if(await this._canUseIndexedDBPromise){const r=await this.read();return xe(this.app,{lastSentHeartbeatDate:t.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...t.heartbeats]})}else return}}function Ue(e){return Te(JSON.stringify({version:2,heartbeats:e})).length}function Qn(e){if(e.length===0)return-1;let t=0,n=e[0].date;for(let r=1;r<e.length;r++)e[r].date<n&&(n=e[r].date,t=r);return t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yn(e){T(new w("platform-logger",t=>new un(t),"PRIVATE")),T(new w("heartbeat",t=>new Gn(t),"PRIVATE")),A(Z,Fe,e),A(Z,Fe,"esm2020"),A("fire-js","")}Yn("");var Xn="firebase",Zn="12.15.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */A(Xn,Zn,"app");const Ve="@firebase/installations",ie="0.6.22";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ke=1e4,qe=`w:${ie}`,We="FIS_v2",er="https://firebaseinstallations.googleapis.com/v1",tr=3600*1e3,nr="installations",rr="Installations";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ir={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"not-registered":"Firebase Installation is not registered.","installation-not-found":"Firebase Installation not found.","request-failed":'{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',"app-offline":"Could not process request. Application offline.","delete-pending-registration":"Can't delete installation while there is a pending registration request."},I=new $(nr,rr,ir);function Ge(e){return e instanceof S&&e.code.includes("request-failed")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ze({projectId:e}){return`${er}/projects/${e}/installations`}function Je(e){return{token:e.token,requestStatus:2,expiresIn:sr(e.expiresIn),creationTime:Date.now()}}async function Qe(e,t){const r=(await t.json()).error;return I.create("request-failed",{requestName:e,serverCode:r.code,serverMessage:r.message,serverStatus:r.status})}function Ye({apiKey:e}){return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e})}function or(e,{refreshToken:t}){const n=Ye(e);return n.append("Authorization",ar(t)),n}async function Xe(e){const t=await e();return t.status>=500&&t.status<600?e():t}function sr(e){return Number(e.replace("s","000"))}function ar(e){return`${We} ${e}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function cr({appConfig:e,heartbeatServiceProvider:t},{fid:n}){const r=ze(e),i=Ye(e),o=t.getImmediate({optional:!0});if(o){const a=await o.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={fid:n,authVersion:We,appId:e.appId,sdkVersion:qe},c={method:"POST",headers:i,body:JSON.stringify(s)},u=await Xe(()=>fetch(r,c));if(u.ok){const a=await u.json();return{fid:a.fid||n,registrationStatus:2,refreshToken:a.refreshToken,authToken:Je(a.authToken)}}else throw await Qe("Create Installation",u)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ze(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ur(e){return btoa(String.fromCharCode(...e)).replace(/\+/g,"-").replace(/\//g,"_")}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dr=/^[cdef][\w-]{21}$/,oe="";function fr(){try{const e=new Uint8Array(17);(self.crypto||self.msCrypto).getRandomValues(e),e[0]=112+e[0]%16;const n=lr(e);return dr.test(n)?n:oe}catch{return oe}}function lr(e){return ur(e).substr(0,22)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function H(e){return`${e.appName}!${e.appId}`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const et=new Map;function tt(e,t){const n=H(e);nt(n,t),hr(n,t)}function nt(e,t){const n=et.get(e);if(n)for(const r of n)r(t)}function hr(e,t){const n=pr();n&&n.postMessage({key:e,fid:t}),gr()}let E=null;function pr(){return!E&&"BroadcastChannel"in self&&(E=new BroadcastChannel("[Firebase] FID Change"),E.onmessage=e=>{nt(e.data.key,e.data.fid)}),E}function gr(){et.size===0&&E&&(E.close(),E=null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const br="firebase-installations-database",mr=1,_="firebase-installations-store";let se=null;function ae(){return se||(se=L(br,mr,{upgrade:(e,t)=>{switch(t){case 0:e.createObjectStore(_)}}})),se}async function j(e,t){const n=H(e),i=(await ae()).transaction(_,"readwrite"),o=i.objectStore(_),s=await o.get(n);return await o.put(t,n),await i.done,(!s||s.fid!==t.fid)&&tt(e,t.fid),t}async function rt(e){const t=H(e),r=(await ae()).transaction(_,"readwrite");await r.objectStore(_).delete(t),await r.done}async function U(e,t){const n=H(e),i=(await ae()).transaction(_,"readwrite"),o=i.objectStore(_),s=await o.get(n),c=t(s);return c===void 0?await o.delete(n):await o.put(c,n),await i.done,c&&(!s||s.fid!==c.fid)&&tt(e,c.fid),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ce(e){let t;const n=await U(e.appConfig,r=>{const i=wr(r),o=yr(e,i);return t=o.registrationPromise,o.installationEntry});return n.fid===oe?{installationEntry:await t}:{installationEntry:n,registrationPromise:t}}function wr(e){const t=e||{fid:fr(),registrationStatus:0};return ot(t)}function yr(e,t){if(t.registrationStatus===0){if(!navigator.onLine){const i=Promise.reject(I.create("app-offline"));return{installationEntry:t,registrationPromise:i}}const n={fid:t.fid,registrationStatus:1,registrationTime:Date.now()},r=Ir(e,n);return{installationEntry:n,registrationPromise:r}}else return t.registrationStatus===1?{installationEntry:t,registrationPromise:Er(e)}:{installationEntry:t}}async function Ir(e,t){try{const n=await cr(e,t);return j(e.appConfig,n)}catch(n){throw Ge(n)&&n.customData.serverCode===409?await rt(e.appConfig):await j(e.appConfig,{fid:t.fid,registrationStatus:0}),n}}async function Er(e){let t=await it(e.appConfig);for(;t.registrationStatus===1;)await Ze(100),t=await it(e.appConfig);if(t.registrationStatus===0){const{installationEntry:n,registrationPromise:r}=await ce(e);return r||n}return t}function it(e){return U(e,t=>{if(!t)throw I.create("installation-not-found");return ot(t)})}function ot(e){return _r(e)?{fid:e.fid,registrationStatus:0}:e}function _r(e){return e.registrationStatus===1&&e.registrationTime+Ke<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Sr({appConfig:e,heartbeatServiceProvider:t},n){const r=Tr(e,n),i=or(e,n),o=t.getImmediate({optional:!0});if(o){const a=await o.getHeartbeatsHeader();a&&i.append("x-firebase-client",a)}const s={installation:{sdkVersion:qe,appId:e.appId}},c={method:"POST",headers:i,body:JSON.stringify(s)},u=await Xe(()=>fetch(r,c));if(u.ok){const a=await u.json();return Je(a)}else throw await Qe("Generate Auth Token",u)}function Tr(e,{fid:t}){return`${ze(e)}/${t}/authTokens:generate`}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ue(e,t=!1){let n;const r=await U(e.appConfig,o=>{if(!at(o))throw I.create("not-registered");const s=o.authToken;if(!t&&Cr(s))return o;if(s.requestStatus===1)return n=Ar(e,t),o;{if(!navigator.onLine)throw I.create("app-offline");const c=kr(o);return n=Dr(e,c),c}});return n?await n:r.authToken}async function Ar(e,t){let n=await st(e.appConfig);for(;n.authToken.requestStatus===1;)await Ze(100),n=await st(e.appConfig);const r=n.authToken;return r.requestStatus===0?ue(e,t):r}function st(e){return U(e,t=>{if(!at(t))throw I.create("not-registered");const n=t.authToken;return Rr(n)?{...t,authToken:{requestStatus:0}}:t})}async function Dr(e,t){try{const n=await Sr(e,t),r={...t,authToken:n};return await j(e.appConfig,r),n}catch(n){if(Ge(n)&&(n.customData.serverCode===401||n.customData.serverCode===404))await rt(e.appConfig);else{const r={...t,authToken:{requestStatus:0}};await j(e.appConfig,r)}throw n}}function at(e){return e!==void 0&&e.registrationStatus===2}function Cr(e){return e.requestStatus===2&&!vr(e)}function vr(e){const t=Date.now();return t<e.creationTime||e.creationTime+e.expiresIn<t+tr}function kr(e){const t={requestStatus:1,requestTime:Date.now()};return{...e,authToken:t}}function Rr(e){return e.requestStatus===1&&e.requestTime+Ke<Date.now()}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Or(e){const t=e,{installationEntry:n,registrationPromise:r}=await ce(t);return r?r.catch(console.error):ue(t).catch(console.error),n.fid}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Mr(e,t=!1){const n=e;return await Nr(n),(await ue(n,t)).token}async function Nr(e){const{registrationPromise:t}=await ce(e);t&&await t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Br(e){if(!e||!e.options)throw de("App Configuration");if(!e.name)throw de("App Name");const t=["projectId","apiKey","appId"];for(const n of t)if(!e.options[n])throw de(n);return{appName:e.name,projectId:e.options.projectId,apiKey:e.options.apiKey,appId:e.options.appId}}function de(e){return I.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ct="installations",Fr="installations-internal",$r=e=>{const t=e.getProvider("app").getImmediate(),n=Br(t),r=ne(t,"heartbeat");return{app:t,appConfig:n,heartbeatServiceProvider:r,_delete:()=>Promise.resolve()}},Lr=e=>{const t=e.getProvider("app").getImmediate(),n=ne(t,ct).getImmediate();return{getId:()=>Or(n),getToken:i=>Mr(n,i)}};function Pr(){T(new w(ct,$r,"PUBLIC")),T(new w(Fr,Lr,"PRIVATE"))}Pr(),A(Ve,ie),A(Ve,ie,"esm2020");/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fe="BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4",xr="https://fcmregistrations.googleapis.com/v1",ut="FCM_MSG",Hr="google.c.a.c_id",dt=1e3,ft=3,lt=864e5,jr=5e3,Ur=1249,Vr=3,Kr=1;var V;(function(e){e[e.DATA_MESSAGE=1]="DATA_MESSAGE",e[e.DISPLAY_NOTIFICATION=3]="DISPLAY_NOTIFICATION"})(V||(V={}));/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */var R;(function(e){e.PUSH_RECEIVED="push-received",e.NOTIFICATION_CLICKED="notification-clicked",e.FID_REGISTERED="fid-registered"})(R||(R={}));/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function l(e){const t=new Uint8Array(e);return btoa(String.fromCharCode(...t)).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function ht(e){const t="=".repeat((4-e.length%4)%4),n=(e+t).replace(/\-/g,"+").replace(/_/g,"/"),r=atob(n),i=new Uint8Array(r.length);for(let o=0;o<r.length;++o)i[o]=r.charCodeAt(o);return i}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const le="fcm_token_details_db",qr=5,pt="fcm_token_object_Store";async function Wr(e){if("databases"in indexedDB&&!(await indexedDB.databases()).map(o=>o.name).includes(le))return null;let t=null;return(await L(le,qr,{upgrade:async(r,i,o,s)=>{if(i<2||!r.objectStoreNames.contains(pt))return;const c=s.objectStore(pt),u=await c.index("fcmSenderId").get(e);if(await c.clear(),!!u){if(i===2){const a=u;if(!a.auth||!a.p256dh||!a.endpoint)return;t={token:a.fcmToken,createTime:a.createTime??Date.now(),subscriptionOptions:{auth:a.auth,p256dh:a.p256dh,endpoint:a.endpoint,swScope:a.swScope,vapidKey:typeof a.vapidKey=="string"?a.vapidKey:l(a.vapidKey)}}}else if(i===3){const a=u;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:l(a.auth),p256dh:l(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:l(a.vapidKey)}}}else if(i===4){const a=u;t={token:a.fcmToken,createTime:a.createTime,subscriptionOptions:{auth:l(a.auth),p256dh:l(a.p256dh),endpoint:a.endpoint,swScope:a.swScope,vapidKey:l(a.vapidKey)}}}}}})).close(),await P(le),await P("fcm_vapid_details_db"),await P("undefined"),Gr(t)?t:null}function Gr(e){if(!e||!e.subscriptionOptions)return!1;const{subscriptionOptions:t}=e;return typeof e.createTime=="number"&&e.createTime>0&&typeof e.token=="string"&&e.token.length>0&&typeof t.auth=="string"&&t.auth.length>0&&typeof t.p256dh=="string"&&t.p256dh.length>0&&typeof t.endpoint=="string"&&t.endpoint.length>0&&typeof t.swScope=="string"&&t.swScope.length>0&&typeof t.vapidKey=="string"&&t.vapidKey.length>0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const zr={"missing-app-config-values":'Missing App configuration value: "{$valueName}"',"only-available-in-window":"This method is available in a Window context.","only-available-in-sw":"This method is available in a service worker context.","permission-default":"The notification permission was not granted and dismissed instead.","permission-blocked":"The notification permission was not granted and blocked instead.","unsupported-browser":"This browser doesn't support the API's required to use the Firebase SDK.","indexed-db-unsupported":"This browser doesn't support indexedDb.open() (ex. Safari iFrame, Firefox Private Browsing, etc)","failed-service-worker-registration":"We are unable to register the default service worker. {$browserErrorMessage}","token-subscribe-failed":"A problem occurred while subscribing the user to FCM: {$errorInfo}","token-subscribe-no-token":"FCM returned no token when subscribing the user to push.","fid-registration-failed":"A problem occurred while creating an FCM registration via FID: {$errorInfo}","fid-unregister-failed":"A problem occurred while unregistering the FCM registration via FID: {$errorInfo}","fid-registration-idb-schema-unavailable":"Unable to read or persist FID registration metadata because the messaging IndexedDB schema is unavailable (for example, the database could not be upgraded to the latest version).","token-unsubscribe-failed":"A problem occurred while unsubscribing the user from FCM: {$errorInfo}","token-update-failed":"A problem occurred while updating the user from FCM: {$errorInfo}","token-update-no-token":"FCM returned no token when updating the user to push.","use-sw-after-get-token":"The useServiceWorker() method may only be called once and must be called before calling getToken() to ensure your service worker is used.","invalid-sw-registration":"The input to useServiceWorker() must be a ServiceWorkerRegistration.","invalid-bg-handler":"The input to setBackgroundMessageHandler() must be a function.","invalid-vapid-key":"The public VAPID key must be a string.","use-vapid-key-after-get-token":"The usePublicVapidKey() method may only be called once and must be called before calling getToken() to ensure your VAPID key is used.","invalid-on-registered-handler":"No onRegistered callback handler was provided or registered. Implement onRegistered() before register()."},f=new $("messaging","Messaging",zr);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const gt="firebase-messaging-database",bt=2,b="firebase-messaging-store",h="firebase-messaging-fid-registration-store";let mt={openDB:L,deleteDB:P},O=null;function Jr(e,t,n){switch(t){case 0:if(e.createObjectStore(b),n===1)break;case 1:n===2&&e.createObjectStore(h)}}function wt(e){return{upgrade:(t,n)=>{Jr(t,n,e)},blocked:()=>{},blocking:(t,n,r)=>{var i;O=null,(i=r.target)==null||i.close()},terminated:()=>{O=null}}}function D(){return O||(O=mt.openDB(gt,bt,wt(2)).catch(()=>mt.openDB(gt,bt-1,wt(1)))),O}function yt(e,t){return e.objectStoreNames.contains(t)}function he(e){if(!yt(e,h))throw f.create("fid-registration-idb-schema-unavailable")}async function pe(e){const t=C(e),r=await(await D()).transaction(b).objectStore(b).get(t);if(r)return r;{const i=await Wr(e.appConfig.senderId);if(i)return await ge(e,i),i}}async function ge(e,t){const n=C(e),r=await D(),i=[b],o=yt(r,h);o&&i.push(h);const s=r.transaction(i,"readwrite");return await s.objectStore(b).put(t,n),o&&await s.objectStore(h).delete(n),await s.done,t}async function Qr(e){const t=C(e),r=(await D()).transaction(b,"readwrite");await r.objectStore(b).delete(t),await r.done}async function be(e){const t=C(e),n=await D();return he(n),await n.transaction(h).objectStore(h).get(t)}async function Yr(e,t){const n=C(e),r=await D();he(r);const i=r.transaction([b,h],"readwrite");return await i.objectStore(h).put(t,n),await i.objectStore(b).delete(n),await i.done,t}async function Xr(e){const t=C(e),n=await D();he(n);const r=n.transaction(h,"readwrite");await r.objectStore(h).delete(t),await r.done}function C({appConfig:e}){return e.appId}const Zr="0.13.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ei=3,ti=1e3;async function ni(e,t){const n=await N(e),r=me(t,e.appConfig.appName,!1),i={method:"POST",headers:n,body:JSON.stringify(r)};let o;try{o=await(await fetch(M(e.appConfig),i)).json()}catch(s){throw f.create("token-subscribe-failed",{errorInfo:s==null?void 0:s.toString()})}if(o.error){const s=o.error.message;throw f.create("token-subscribe-failed",{errorInfo:s})}if(!o.token)throw f.create("token-subscribe-no-token");return o.token}async function ri(e,t){var u;const n=await N(e),r=me(t,e.appConfig.appName,!0),i={method:"POST",headers:n,body:JSON.stringify(r)};let o;try{o=await ci(()=>fetch(M(e.appConfig),i),ei,ti)}catch(a){throw f.create("fid-registration-failed",{errorInfo:a==null?void 0:a.toString()})}if(o.ok)return{responseFid:await oi(o)};let s;try{s=await o.json()}catch{throw f.create("fid-registration-failed",{errorInfo:o.statusText})}const c=((u=s.error)==null?void 0:u.message)??o.statusText;throw f.create("fid-registration-failed",{errorInfo:c})}async function ii(e,t){var o;const r={method:"DELETE",headers:await N(e)};let i;try{i=await fetch(`${M(e.appConfig)}/${t}`,r)}catch(s){throw f.create("fid-unregister-failed",{errorInfo:s==null?void 0:s.toString()})}if(!i.ok)try{throw((o=(await i.json()).error)==null?void 0:o.message)??i.statusText}catch(s){throw f.create("fid-unregister-failed",{errorInfo:typeof s=="string"&&s||i.statusText||(s==null?void 0:s.toString())})}}async function oi(e){const t=await e.text();if(!t.trim())throw f.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is empty"});let n;try{n=JSON.parse(t)}catch{throw f.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response body is not valid JSON"})}const r=n.name;if(typeof r!="string"||r.length===0)throw f.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response did not include a non-empty name"});return si(r)}const It="/registrations/";function si(e){const t=e.indexOf(It);if(t!==-1){const n=e.slice(t+It.length);if(n.length>0)return n}throw f.create("fid-registration-failed",{errorInfo:"CreateRegistration succeeded but response name is not a valid registration resource name"})}async function ai(e,t){const n=await N(e),r=me(t.subscriptionOptions,e.appConfig.appName,!1),i={method:"PATCH",headers:n,body:JSON.stringify(r)};let o;try{o=await(await fetch(`${M(e.appConfig)}/${t.token}`,i)).json()}catch(s){throw f.create("token-update-failed",{errorInfo:s==null?void 0:s.toString()})}if(o.error){const s=o.error.message;throw f.create("token-update-failed",{errorInfo:s})}if(!o.token)throw f.create("token-update-no-token");return o.token}async function Et(e,t){const r={method:"DELETE",headers:await N(e)};try{const o=await(await fetch(`${M(e.appConfig)}/${t}`,r)).json();if(o.error){const s=o.error.message;throw f.create("token-unsubscribe-failed",{errorInfo:s})}}catch(i){throw f.create("token-unsubscribe-failed",{errorInfo:i==null?void 0:i.toString()})}}async function ci(e,t,n){let r;for(let i=0;i<t;i++)try{return await e()}catch(o){if(r=o,i<t-1){const s=n*Math.pow(2,i);await new Promise(c=>setTimeout(c,s))}}throw r}function M({projectId:e}){return`${xr}/projects/${e}/registrations`}async function N({appConfig:e,installations:t}){const n=await t.getToken();return new Headers({"Content-Type":"application/json",Accept:"application/json","x-goog-api-key":e.apiKey,"x-goog-firebase-installations-auth":`FIS ${n}`})}function ui(e,t){var n,r;try{if(/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(e))return new URL(e).host}catch{}try{if(typeof self<"u"&&((n=self.location)!=null&&n.href))return new URL(e,self.location.origin).host}catch{}return typeof self<"u"&&((r=self.location)!=null&&r.host)?self.location.host:t}function me({p256dh:e,auth:t,endpoint:n,vapidKey:r,swScope:i},o,s){const c={web:{origin:ui(i,o),endpoint:n,auth:t,p256dh:e}};return s&&(c.fcm_sdk_version=Zr),r!==fe&&(c.web.applicationPubKey=r),c}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const di=10080*60*1e3;async function fi(e){const t=await gi(e.swRegistration,e.vapidKey),n={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:t.endpoint,auth:l(t.getKey("auth")),p256dh:l(t.getKey("p256dh"))},r=await pe(e.firebaseDependencies);if(r){if(bi(r.subscriptionOptions,n))return Date.now()>=r.createTime+di?pi(e,{token:r.token,createTime:Date.now(),subscriptionOptions:n}):r.token;try{await Et(e.firebaseDependencies,r.token)}catch(i){console.warn(i)}return St(e.firebaseDependencies,n)}else return St(e.firebaseDependencies,n)}async function li(e,t){await Et(e.firebaseDependencies,t.token),await Qr(e.firebaseDependencies),await Tt(e.firebaseDependencies)}async function hi(e){const t=await be(e.firebaseDependencies).catch(()=>{}),n=t==null?void 0:t.fid;n&&await ii(e.firebaseDependencies,n),await Tt(e.firebaseDependencies),n&&wi(e,n)}async function _t(e){const t=await pe(e.firebaseDependencies);t?await li(e,t):await hi(e);const n=await e.swRegistration.pushManager.getSubscription();return n?n.unsubscribe():!0}async function pi(e,t){try{const n=await ai(e.firebaseDependencies,t),r={...t,token:n,createTime:Date.now()};return await ge(e.firebaseDependencies,r),n}catch(n){throw n}}async function St(e,t){const r={token:await ni(e,t),createTime:Date.now(),subscriptionOptions:t};return await ge(e,r),r.token}async function gi(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:ht(t)})}function bi(e,t){const n=t.vapidKey===e.vapidKey,r=t.endpoint===e.endpoint,i=t.auth===e.auth,o=t.p256dh===e.p256dh;return n&&r&&i&&o}async function Tt(e){try{await Xr(e)}catch{}}function mi(e,t){const n=e.onRegisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}function wi(e,t){const n=e.onUnregisteredHandler;n&&(typeof n=="function"?n(t):n.next(t))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function yi(e,t){t?e.vapidKey=t:e.vapidKey||(e.vapidKey=fe)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const At=3;async function Ii(e,t){const n=await Ei(e.swRegistration,e.vapidKey),r={vapidKey:e.vapidKey,swScope:e.swRegistration.scope,endpoint:n.endpoint,auth:l(n.getKey("auth")),p256dh:l(n.getKey("p256dh"))},i=e.firebaseDependencies.installations;for(let o=0;o<At;o++){const{responseFid:s}=await ri(e.firebaseDependencies,r);if(s===t)return;o<At-1&&await i.getToken(!0)}throw f.create("fid-registration-failed",{errorInfo:"CreateRegistration response FID does not match Firebase Installation ID"})}async function Ei(e,t){const n=await e.pushManager.getSubscription();return n||e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:ht(t)})}/**
 * @license
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function _i(e){const t=await be(e.firebaseDependencies).catch(()=>{});if(!t)return;await yi(e,t.vapidKey);const n=await e.firebaseDependencies.installations.getId();return await Ii(e,n),await Yr(e.firebaseDependencies,{fid:n,lastRegisterTime:Date.now(),vapidKey:e.vapidKey}),mi(e,n),n}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Si(e){const t={from:e.from,collapseKey:e.collapse_key,messageId:e.fcmMessageId};return Ti(t,e),Ai(t,e),Di(t,e),t}function Ti(e,t){if(!t.notification)return;e.notification={};const n=t.notification.title;n&&(e.notification.title=n);const r=t.notification.body;r&&(e.notification.body=r);const i=t.notification.image;i&&(e.notification.image=i);const o=t.notification.icon;o&&(e.notification.icon=o)}function Ai(e,t){t.data&&(e.data=t.data)}function Di(e,t){var i,o,s,c;if(!t.fcmOptions&&!((i=t.notification)!=null&&i.click_action))return;e.fcmOptions={};const n=((o=t.fcmOptions)==null?void 0:o.link)??((s=t.notification)==null?void 0:s.click_action);n&&(e.fcmOptions.link=n);const r=(c=t.fcmOptions)==null?void 0:c.analytics_label;r&&(e.fcmOptions.analyticsLabel=r)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ci(e){return typeof e=="object"&&!!e&&Hr in e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function vi(e){return new Promise(t=>{setTimeout(t,e)})}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ki="https://play.google.com/log?format=json_proto3",Dt=0,Ri=Pi("AzSCbw63g1R0nCw85jG8","Iaya3yLKwmgvh7cF0q4");function Oi(e){e.logQueue.state==="stopped"&&e.logEvents.length>0&&we(e,Dt)}function we(e,t){if(e.logQueue.state==="scheduled"&&clearTimeout(e.logQueue.timerId),e.logQueue={state:"stopped"},!e.deliveryMetricsExportedToBigQueryEnabled){e.logEvents=[];return}e.logQueue={state:"scheduled",timerId:setTimeout(async()=>{if(e.logQueue={state:"flushing"},!e.logEvents.length)return we(e,lt);await Mi(e)},t)}}async function Mi(e){const t=e.logEvents;e.logEvents=[];for(let n=0,r=t.length;n<r;n+=dt){const i=t.slice(n,n+dt);if(!i.length)break;const o=Li(i);let s=0,c={};do{try{if(c=await fetch(ki.concat("&key=",Ri),{method:"POST",body:JSON.stringify(o)}),c.ok||!c.ok&&!Ct(c))break;if(!c.ok&&Ct(c))throw new Error("a retriable Non-200 code is returned in fetch to Firelog endpoint. Retry")}catch{if(s===ft)break}let u;try{u=Number((await c.json()).nextRequestWaitMillis)}catch{u=jr}await new Promise(a=>setTimeout(a,u)),s++}while(s<ft)}we(e,e.logEvents.length?Dt:lt)}function Ct(e){const t=e.status;return t===429||t===500||t===503||t===504}async function Ni(e,t){const n=Bi(t,await e.firebaseDependencies.installations.getId());Fi(e,n,t.productId),Oi(e)}function Bi(e,t){var r,i;const n={};return e.from&&(n.project_number=e.from),e.fcmMessageId&&(n.message_id=e.fcmMessageId),n.instance_id=t,e.notification?n.message_type=V.DISPLAY_NOTIFICATION.toString():n.message_type=V.DATA_MESSAGE.toString(),n.sdk_platform=Vr.toString(),n.package_name=self.origin.replace(/(^\w+:|^)\/\//,""),e.collapse_key&&(n.collapse_key=e.collapse_key),n.event=Kr.toString(),(r=e.fcmOptions)!=null&&r.analytics_label&&(n.analytics_label=(i=e.fcmOptions)==null?void 0:i.analytics_label),n}function Fi(e,t,n){const r={};r.event_time_ms=Math.floor(Date.now()).toString(),r.source_extension_json_proto3=JSON.stringify({messaging_client_event:t}),n&&(r.compliance_data=$i(n)),e.logEvents.push(r)}function $i(e){return{privacy_context:{prequest:{origin_associated_product_id:e}}}}function Li(e){const t={};return t.log_source=Ur.toString(),t.log_event=e,t}function Pi(e,t){const n=[];for(let r=0;r<e.length;r++)n.push(e.charAt(r)),r<t.length&&n.push(t.charAt(r));return n.join("")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function xi(e,t){var o;t.swRegistration||(t.swRegistration=self.registration);const{newSubscription:n}=e;if(!n){await _t(t);return}if(await be(t.firebaseDependencies).catch(()=>{})){const s=await _i(t).catch(()=>{});if(s){const c=await ye();vt(c)&&Wi(c,s)}return}const i=await pe(t.firebaseDependencies);await _t(t),t.vapidKey=((o=i==null?void 0:i.subscriptionOptions)==null?void 0:o.vapidKey)??fe,await fi(t)}async function Hi(e,t){const n=Vi(e);if(!n)return;t.deliveryMetricsExportedToBigQueryEnabled&&await Ni(t,n);const r=await ye();if(vt(r))return qi(r,n);if(n.notification&&await Gi(Ui(n)),!!t&&t.onBackgroundMessageHandler){const i=Si(n);typeof t.onBackgroundMessageHandler=="function"?await t.onBackgroundMessageHandler(i):t.onBackgroundMessageHandler.next(i)}}async function ji(e){var s,c;const t=(c=(s=e.notification)==null?void 0:s.data)==null?void 0:c[ut];if(t){if(e.action)return}else return;e.stopImmediatePropagation(),e.notification.close();const n=zi(t);if(!n)return;const r=new URL(n,self.location.href),i=new URL(self.location.origin);if(r.host!==i.host)return;let o=await Ki(r);if(o?o=await o.focus():(o=await self.clients.openWindow(n),await vi(3e3)),!!o)return t.messageType=R.NOTIFICATION_CLICKED,t.isFirebaseMessaging=!0,o.postMessage(t)}function Ui(e){const t={...e.notification};return t.data={[ut]:e},t}function Vi({data:e}){if(!e)return null;try{return e.json()}catch{return null}}async function Ki(e){const t=await ye();for(const n of t){const r=new URL(n.url,self.location.href);if(e.host===r.host)return n}return null}function vt(e){return e.some(t=>t.visibilityState==="visible"&&!t.url.startsWith("chrome-extension://"))}function qi(e,t){t.isFirebaseMessaging=!0,t.messageType=R.PUSH_RECEIVED;for(const n of e)n.postMessage(t)}function Wi(e,t){const n={isFirebaseMessaging:!0,messageType:R.FID_REGISTERED,fid:t};for(const r of e)r.postMessage(n)}function ye(){return self.clients.matchAll({type:"window",includeUncontrolled:!0})}function Gi(e){const{actions:t}=e,{maxActions:n}=Notification;return t&&n&&t.length>n&&console.warn(`This browser only supports ${n} actions. The remaining actions will not be displayed.`),self.registration.showNotification(e.title??"",e)}function zi(e){var n,r;const t=((n=e.fcmOptions)==null?void 0:n.link)??((r=e.notification)==null?void 0:r.click_action);return t||(Ci(e.data)?self.location.origin:null)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ji(e){if(!e||!e.options)throw Ie("App Configuration Object");if(!e.name)throw Ie("App Name");const t=["projectId","apiKey","appId","messagingSenderId"],{options:n}=e;for(const r of t)if(!n[r])throw Ie(r);return{appName:e.name,projectId:n.projectId,apiKey:n.apiKey,appId:n.appId,senderId:n.messagingSenderId}}function Ie(e){return f.create("missing-app-config-values",{valueName:e})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qi{constructor(t,n,r){this.deliveryMetricsExportedToBigQueryEnabled=!1,this.onBackgroundMessageHandler=null,this.onMessageHandler=null,this.onRegisteredHandler=null,this.onUnregisteredHandler=null,this._registerNotifyChain=Promise.resolve(),this._fidChangeUnsubscribe=null,this.logEvents=[],this.logQueue={state:"stopped"};const i=Ji(t);this.firebaseDependencies={app:t,appConfig:i,installations:n,analyticsProvider:r}}_delete(){return this._fidChangeUnsubscribe&&(this._fidChangeUnsubscribe(),this._fidChangeUnsubscribe=null),this.logQueue.state==="scheduled"&&clearTimeout(this.logQueue.timerId),this.logQueue={state:"stopped"},Promise.resolve()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Yi=e=>{const t=new Qi(e.getProvider("app").getImmediate(),e.getProvider("installations-internal").getImmediate(),e.getProvider("analytics-internal"));return self.addEventListener("push",n=>{n.waitUntil(Hi(n,t))}),self.addEventListener("pushsubscriptionchange",n=>{n.waitUntil(xi(n,t))}),self.addEventListener("notificationclick",n=>{n.waitUntil(ji(n))}),t};function Xi(){T(new w("messaging-sw",Yi,"PUBLIC"))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Zi(){return De()&&await Ce()&&"PushManager"in self&&"Notification"in self&&ServiceWorkerRegistration.prototype.hasOwnProperty("showNotification")&&PushSubscription.prototype.hasOwnProperty("getKey")}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function eo(e,t){if(self.document!==void 0)throw f.create("only-available-in-sw");return e.onBackgroundMessageHandler=t,()=>{e.onBackgroundMessageHandler=null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function to(e=jn()){return Zi().then(t=>{if(!t)throw f.create("unsupported-browser")},t=>{throw f.create("indexed-db-unsupported")}),ne(ke(e),"messaging-sw").getImmediate()}function no(e,t){return e=ke(e),eo(e,t)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Xi();const v=new URL(self.location).searchParams,ro=Le({apiKey:v.get("apiKey"),authDomain:v.get("authDomain"),projectId:v.get("projectId"),storageBucket:v.get("storageBucket"),messagingSenderId:v.get("messagingSenderId"),appId:v.get("appId")}),io=to(ro);no(io,e=>{var n,r,i;const t=((n=e.notification)==null?void 0:n.title)??"Muraja'a Monitor";self.registration.showNotification(t,{body:((r=e.notification)==null?void 0:r.body)??"",icon:"/images/logo.png",badge:"/images/logo.png",data:{url:((i=e.data)==null?void 0:i.url)||"/"}})}),self.addEventListener("notificationclick",e=>{var n;e.notification.close();const t=((n=e.notification.data)==null?void 0:n.url)||"/";e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:!0}).then(r=>{for(const i of r)if(i.url.includes(t)&&"focus"in i)return i.focus();if(clients.openWindow)return clients.openWindow(t)}))})})();
