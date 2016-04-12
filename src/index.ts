/*
    Deprecated Decorator v0.1
    https://github.com/vilic/deprecated-decorator
*/

interface HashSet {
    [key: string]: boolean;
}

/** @internal */
export interface Warner {
    (): void;
}

/** @internal */
export const options = {
    getWarner: undefined as typeof createWarner
};

function createWarner(type: string, name: string, alternative: string, version: string, url: string): Warner {
    let warnedPositions: HashSet = {};

    return () => {
        let stack: string = (<any>new Error()).stack || '';
        let at = (stack.match(/(?:\s+at\s.+){2}\s+at\s(.+)/) || [undefined, ''])[1];

        if (/\)$/.test(at)) {
            at = at.match(/[^(]+(?=\)$)/)[0];
        } else {
            at = at.trim();
        }

        if (at in warnedPositions) {
            return;
        }

        warnedPositions[at] = true;

        let message: string;

        switch (type) {
            case 'class':
                message = 'Class';
                break;
            case 'property':
                message = 'Property';
                break;
            case 'method':
                message = 'Method';
                break;
            case 'function':
                message = 'Function';
                break;
        }

        message += ` \`${name}\` has been deprecated`;

        if (version) {
            message += ` since version ${version}`;
        }

        if (alternative) {
            message += `, use \`${alternative}\` instead`;
        }

        message += '.';

        if (at) {
            message += `\n    at ${at}`;
        }

        if (url) {
            message += `\nCheck out ${url} for more information.`;
        }

        console.warn(message);
    };
}

function decorateProperty(
    type: string,
    name: string,
    descriptor: PropertyDescriptor,
    alternative: string,
    version: string,
    url: string
): PropertyDescriptor {
    let warner = (options.getWarner || createWarner)(type, name, alternative, version, url);

    descriptor = descriptor || {
        writable: true,
        enumerable: false,
        configurable: true
    };

    let deprecatedDescriptor: PropertyDescriptor = {
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable
    };

    if (descriptor.get || descriptor.set) {
        if (descriptor.get) {
            deprecatedDescriptor.get = function () {
                warner();
                return descriptor.get.call(this);
            };
        }

        if (descriptor.set) {
            deprecatedDescriptor.set = function (value) {
                warner();
                return descriptor.set.call(this, value);
            };
        }
    } else {
        let propertyValue = descriptor.value;

        deprecatedDescriptor.get = function () {
            warner();
            return propertyValue;
        };

        if (descriptor.writable) {
            deprecatedDescriptor.set = function (value) {
                warner();
                propertyValue = value;
            };
        }
    }

    return deprecatedDescriptor;
}

function decorateFunction<T extends Function>(
    type: string,
    target: T,
    alternative: string,
    version: string,
    url: string
): T {
    let name: string = (<any>target).name;
    let warner = (options.getWarner || createWarner)(type, name, alternative, version, url);

    let fn: T = <any>function () {
        warner();
        return target.apply(this, arguments);
    };

    for (let propertyName of Object.getOwnPropertyNames(target)) {
        let descriptor = Object.getOwnPropertyDescriptor(target, propertyName);

        if (descriptor.writable) {
            (<any>fn)[propertyName] = (<any>target)[propertyName];
        } else if (descriptor.configurable) {
            Object.defineProperty(fn, propertyName, descriptor);
        }
    }

    return fn;
}

export type DeprecatedDecorator = ClassDecorator & PropertyDecorator;

export interface DeprecatedOptions {
    alternative?: string;
    version?: string;
    url?: string;
}

export function deprecated(options?: DeprecatedOptions): DeprecatedDecorator;
export function deprecated(alternative?: string, version?: string, url?: string): DeprecatedDecorator;
export function deprecated<T extends Function>(fn: T): T;
export function deprecated<T extends Function>(options: DeprecatedOptions, fn: T): T;
export function deprecated<T extends Function>(alternative: string, fn: T): T;
export function deprecated<T extends Function>(alternative: string, version: string, fn: T): T;
export function deprecated<T extends Function>(alternative: string, version: string, url: string, fn: T): T;
export function deprecated(...args: any[]): any {
    let fn = args[args.length - 1];

    if (typeof fn === 'function') {
        fn = args.pop();
    } else {
        fn = undefined;
    }

    let options = args[0];

    let alternative: string;
    let version: string;
    let url: string;

    if (typeof options === 'string') {
        alternative = options;
        version = args[1];
        url = args[2];
    } else if (options) {
        ({
            alternative,
            version,
            url
        } = options);
    }

    if (fn) {
        return decorateFunction('function', fn, alternative, version, url);
    }

    return (target: Function | Object, name?: string, descriptor?: PropertyDescriptor): Function | PropertyDescriptor => {
        if (typeof name === 'string') {
            let type = descriptor && typeof descriptor.value === 'function' ?
                'method' : 'property';

            return decorateProperty(type, name, descriptor, alternative, version, url);
        } else if (typeof target === 'function') {
            let constructor = decorateFunction('class', target as Function, alternative, version, url);
            let className: string = (<any>target).name;

            for (let propertyName of Object.getOwnPropertyNames(constructor)) {
                let descriptor = Object.getOwnPropertyDescriptor(constructor, propertyName);
                descriptor = decorateProperty('class', className, descriptor, alternative, version, url);

                if (descriptor.writable) {
                    (<any>constructor)[propertyName] = (<any>target)[propertyName];
                } else if (descriptor.configurable) {
                    Object.defineProperty(constructor, propertyName, descriptor);
                }
            }

            return constructor;
        }
    };
}

export default deprecated;
