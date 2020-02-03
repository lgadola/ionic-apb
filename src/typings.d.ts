/*
 * Extra typings definitions
 */

// Allow .json files imports
declare module '*.json';

// SystemJS module definition
declare var module: NodeModule;
interface NodeModule {
  id: string;
}
declare module 'devextreme/core/utils/deferred' {
  const value: any;
  export default value;
}

declare module 'devextreme/core/utils/ajax' {
  const value: any;
  export default value;
}
