[![NPM Package](https://badge.fury.io/js/deprecated-decorator.svg)](https://www.npmjs.com/package/deprecated-decorator)
[![Build Status](https://travis-ci.org/vilic/deprecated-decorator.svg)](https://travis-ci.org/vilic/deprecated-decorator) 

# Deprecated Decorator

A simple decorator for deprecated properties, methods and classes.

## Install

```sh
npm install deprecated-decorator --save
```

## Usage

Decorating a class will enable warning on constructor and static methods (including static getters and setters):

```ts
// alternative, since version, url
@deprecated('Bar', '0.1.0', 'http://vane.life/')
class Foo {
    static method() { }
}
```

Or you can decorate methods respectively:

```ts
class Foo {
    @deprecated('otherMethod')
    method() { }
    
    @deprecated('otherProperty')
    get property() { }
}
```

## License

MIT License.
