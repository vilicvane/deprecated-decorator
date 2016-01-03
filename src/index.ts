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
        let at = (stack.match(/(?:\s+at\s.+){2}\s+at\s(.+)/) || [])[1];
        
        if (/\)$/.test(at)) {
            at = at.match(/[^(]+(?=\)$)/)[0];
        } else {
            at = at.trim();
        }
        
        if (at in warnedPositions) {
            return;
        }
        
        warnedPositions[at] = true;
        
        let message = `${type === 'property' ? 'Property or method' : 'Class'} "${name}" has been deprecated`;
        
        if (version) {
            message += ` since version ${version}`;
        }
        
        if (alternative) {
            message += `, use "${alternative}" instead`;
        }
        
        message += '.';
        
        message += `\n    at ${at}`;
        
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

function decorateClass(
    target: Function,
    alternative: string,
    version: string,
    url: string
) {
    let name: string = (<any>target).name;
    let warner = (options.getWarner || createWarner)('class', name, alternative, version, url);
    
    let constructor = function () {
        warner();
        target.apply(this, arguments);
    };
    
    for (let propertyName of Object.getOwnPropertyNames(target)) {
        let descriptor = Object.getOwnPropertyDescriptor(target, propertyName);
        
        if (descriptor.writable) {
            (<any>constructor)[propertyName] = (<any>target)[propertyName];
        } else if (descriptor.configurable) {
            Object.defineProperty(constructor, propertyName, descriptor);
        }
    }
    
    return constructor;
}

export function deprecated(alternative?: string, version?: string, url?: string) {
    return (target: Function | Object, name?: string, descriptor?: PropertyDescriptor): any => {
        if (typeof name === 'string') {
            return decorateProperty('property', name, descriptor, alternative, version, url);
        } else if (typeof target === 'function') {
            let constructor = decorateClass(target as Function, alternative, version, url);
            
            for (let propertyName of Object.getOwnPropertyNames(constructor)) {
                let descriptor = Object.getOwnPropertyDescriptor(constructor, propertyName);
                descriptor = decorateProperty('class', (<any>target).name, descriptor, alternative, version, url);
                
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
