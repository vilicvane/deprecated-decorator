import * as Sinon from 'sinon';

import deprecated, { deprecated as theSameDeprecated, options } from '../';

let getterSpy = Sinon.spy();
let warnerSpy = Sinon.spy();

options.getWarner = function () {
    getterSpy.apply(this, arguments);
    return warnerSpy;
};

describe('deprecated', () => {
    beforeEach(() => {
        getterSpy.reset();
        warnerSpy.reset();
    });

    context('exports', () => {
        it('should export default', () => {
            deprecated.should.equal(theSameDeprecated);
        });
    });

    context('properties and methods', () => {
        it('should handle properties', () => {
            class Foo {
                @deprecated()
                property: number;
            }

            getterSpy.calledOnce.should.be.true;

            let foo = new Foo();

            foo.property;
            warnerSpy.calledOnce.should.be.true;

            foo.property = 123;
            foo.property.should.equal(123);
        });

        it('should handle static properties', () => {
            class Foo {
                @deprecated()
                static property: number;
            }

            getterSpy.calledOnce.should.be.true;

            Foo.property;
            warnerSpy.calledOnce.should.be.true;

            Foo.property = 123;
            Foo.property.should.equal(123);
        });
    });

    context('getter and setter', () => {
        it('should handle getters and setters', () => {
            class Foo {
                @deprecated()
                get readonly() {
                    return 123;
                }

                set readonly(value) { }
            }

            getterSpy.calledOnce.should.be.true;

            let foo = new Foo();

            foo.readonly;
            warnerSpy.calledOnce.should.be.true;

            foo.readonly = 123;
            warnerSpy.calledTwice.should.be.true;
        });

        it('should handle static getters and setters', () => {
            class Foo {
                private static _property = 123;

                @deprecated()
                static get property() {
                    return this._property;
                }

                static set property(value) {
                    this._property = value;
                }
            }

            getterSpy.calledOnce.should.be.true;

            Foo.property.should.equal(123);
            warnerSpy.calledOnce.should.be.true;

            Foo.property = 456;
            warnerSpy.calledTwice.should.be.true;
            Foo.property.should.equal(456);
        });
    });

    context('classes', () => {
        it('should handle constructor', () => {
            @deprecated()
            class Foo {

            }

            // called multiple times for properties.
            getterSpy.called.should.be.true;
            warnerSpy.called.should.be.false;

            let foo = new Foo();

            warnerSpy.calledOnce.should.be.true;

            ((<any>Foo).name as string).should.equal('Foo');

            warnerSpy.calledTwice.should.be.true;

            foo.should.be.an.instanceOf(Foo);
        });

        it('should handle inherited', () => {
            class Bar { }

            @deprecated()
            class Foo extends Bar { }

            let foo = new Foo();

            foo.should.be.an.instanceOf(Foo);
            foo.should.be.an.instanceOf(Bar);
        });

        it('should handle static properties', () => {
            @deprecated()
            class Foo {
                static get abc() { return 123; }
                static def() { return 456; }
            }

            // called multiple times for properties.
            getterSpy.called.should.be.true;
            warnerSpy.called.should.be.false;

            Foo.abc.should.equal(123);

            warnerSpy.calledOnce.should.be.true;

            Foo.def().should.equal(456);

            warnerSpy.calledTwice.should.be.true;
        });
    });

    context('functions', () => {
        it('should handle functions', () => {
            let fn = deprecated('biu', function test(...args: string[]) {
                return arguments.length;
            });

            getterSpy.called.should.be.true;
            warnerSpy.called.should.be.false;

            (fn('abc', 'def')).should.equal(2);
            (<any>fn).name.should.equal('test');

            warnerSpy.calledOnce.should.be.true;
        });

        it('should handle functions with options object', () => {
            let fn = deprecated({
                alternative: 'biu',
                version: '0.1.2'
            }, function test(...args: string[]) {
                return arguments.length;
            });

            getterSpy.called.should.be.true;
            warnerSpy.called.should.be.false;

            (fn('abc', 'def')).should.equal(2);
            (<any>fn).name.should.equal('test');

            warnerSpy.calledOnce.should.be.true;
        });
    });
});
