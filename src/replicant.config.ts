/**
 * Ideally, we'd want to import without the explicit ".js" extension.
 * However, node needs it by default.
 * It can be overridden via --experimental-specifier-resolution=node
 * (https://github.com/nodejs/node/issues/41465).
 * But it's not easy to pass arguments when specifying the "bin" option in
 * package.json to invoke node. 
 * 
 * Maybe should just try using --experimental-loader when it's no longer
 * experimental.
 */
import {MyLib1} from "./MyLib1.js";
import {MyLib2} from "./MyLib2.js";

import {findUp} from "find-up";

export {MyLib1, MyLib2, findUp};