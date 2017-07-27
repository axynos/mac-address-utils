/**
 * @fileoverview Tests for mac utils
 * @author Silver Sten Kruus
 */

const bufferEqual = require('buffer-equal');

const mocha = require('mocha');
const chai = require('chai');

const mac = require('../src/index');

const assert = chai.assert;   // eslint-disable-line no-unused-vars
// const should = chai.should(); // eslint-disable-line no-unused-vars
const expect = chai.expect;   // eslint-disable-line no-unused-vars
const describe = mocha.describe;
const it = mocha.it;

describe('Interface stuff', () => {
  describe('#getInterfaces()', () => {
    it('Should return an Array', (done) => {
      mac.getInterfaces()
      .then((value) => {
        const nonArray = 'getInterface does\'t return an array.';
        expect(value, nonArray).to.be.a('array');
        done();
      });
    });


    describe('Interfaces', () => {
      it('Should only have Objects in the Array', (done) => {
        const isObject = (item) => {
          const itemType = typeof item;
          return (itemType === 'object');
        };

        mac.getInterfaces()
          .then((array) => {
            const isObjectArray = array.every(isObject);
            const nonObjectsInArray = 'Interface has non-objects in returned array.';
            expect(isObjectArray, nonObjectsInArray).to.equal(true);
            done();
          });
      });


      it('Should have name & mac_address properties', (done) => {
        mac.getInterfaces()
          .then((array) => {
            const noNameProp = 'Interface doesn\'t have a "name" property';
            const noMacProp = 'Interface doesn\' have a "mac_address" property';
            array.every((item => expect(item, noNameProp).to.have.property('name')));
            array.every((item => expect(item, noMacProp).to.have.property('mac_address')));
            done();
          });
      });
    });
  });


  describe('#getInterfaceNames()', () => {
    it('Should be an array', (done) => {
      const notArray = 'Returned value is not an array.';
      mac.getInterfaceNames()
        .then((value) => {
          expect(value, notArray).to.be.a('array');
          done();
        });
    });

    it('Should only contain strings.', (done) => {
      const isString = (item) => {
        const itemType = typeof item;
        return (itemType === 'string');
      };


      mac.getInterfaceNames()
        .then((array) => {
          const isStringArray = array.every(isString);
          const notStringArray = 'Array contains non-string elements.';
          expect(isStringArray, notStringArray).to.equal(true);
          done();
        });
    });
  });

  describe('#getActiveInterface()', () => {
    it('Should return an object', (done) => {
      mac.getActiveInterface()
        .then((value) => {
          expect(typeof value).to.equal('object');
          done();
        });
    });

    it('Should have name & mac_address properties', (done) => {
      mac.getActiveInterface()
        .then((value) => {
          const noNameProp = 'Interface doesn\'t have a "name" property';
          const noMacProp = 'Interface doesn\' have a "mac_address" property';
          expect(value, noNameProp).to.have.property('name');
          expect(value, noMacProp).to.have.property('mac_address');
          done();
        });
    });
  });
});


describe('Mac address stuff', () => {
  describe('#getMacAddress()', () => {
    it('Should return a string', (done) => {
      mac.getMacAddress()
        .then((value) => {
          const notString = 'Returned value is\'t a string.';
          expect(value, notString).to.be.a('String');
          done();
        });
    });

    it('Should return a non-empty string', (done) => {
      mac.getMacAddress()
        .then((value) => {
          const emptyString = 'Returned string is empty.';
          expect(value, emptyString).to.not.equal('');
          done();
        });
    });
  });


  describe('#getMacAddress(netInterface)', () => {
    it('Should return a mac address when given a network interface', (done) => {
      const netInterface = {
        name: 'testInterface',
        mac_address: '00:00:00:00:00:00',
      };

      mac.getMacAddress(netInterface)
      .then((value) => {
        const wrongValue = 'Function returned an incorrect value.';
        expect(value, wrongValue).to.equal('00:00:00:00:00:00');
        done();
      });
    });
  });


  describe('#constructMacAddress()', () => {
    const arrayMac = ['00', '00', '00', '00', '00', '00'];
    const constructedMac = mac.constructMacAddress(arrayMac);

    it('Should return a string.', () => {
      const notString = 'Returned value is not a string.';
      expect(constructedMac, notString).to.be.a('string');
    });

    // TODO: Add more tests here.
  });


  describe('#isMacAddress()', () => {
    const validArray = [
      '09-64-E4-77-F1-4A', '00-00-00-00-00-00', 'ff-ff-ff-ff-ff-ff',
      'Ff-ff-FF-DA-12-00', '1C:91:76:89:60:94', '00:00:00:00:00:00',
      'ff:ff:ff:ff:ff:ff', 'Ff:ff:FF:DA:12:00',
    ];

    const invalidArray = [
      '00-ff-da:ff:00:da', 'xx:00:da:53:ff:ff', 'xx:xx:xx:xx:xx:xx',
      'XX:XX', 'FF:FF:FF:FF:FF:FF:FF', 'fff:00:00:00:00:00',
      'f:ff:ff:ff:ff:ff', '', 'some:random:text', 'justaword',
      'a random sentence',
    ];

    validArray.forEach((address) => {
      it(`Should return true for: ${address}`, () => {
        const validity = mac.isMacAddress(address);
        const incorrectReturn = 'Should be valid.';
        expect(validity, incorrectReturn).to.equal(true);
      });
    });

    invalidArray.forEach((address) => {
      it(`Should return false for: ${address}`, () => {
        const validity = mac.isMacAddress(address);
        const incorrectReturn = 'Incorrectly passed as valid.';
        expect(validity, incorrectReturn).to.equal(false);
      });
    });
  });


  describe('#areEqual()', () => {
    const correctArrays = [
      [
        'AA:AA:AA:AA:AA:AA',
        'AA:AA:AA:AA:AA:AA',
      ],
      [
        // Ayy
        'BB:BB:BB:BB:BB:BB',
        'bb:bb:bb:bb:bb:bb',
        // Wan sum fuk?
      ],
    ];

    const incorrectArrays = [
      [
        'AA:BB:CC:DD:EE:FF',
        'AA:AA:AA:AA:AA:AA',
      ],
      [
        'BB:BB:BB:BB:BB:BB',
        'dd:dd:dd:dd:dd:dd',
        'ff:cc:FF:ee:CC:bb',
      ],
    ];

    correctArrays.forEach((array) => {
      it(`Should return true for ${array}`, () => {
        const equality = mac.areEqual(...array);
        const incorrectReturn = 'Incorrectly checked equality.';
        expect(equality, incorrectReturn).to.equal(true);
      });
    });

    incorrectArrays.forEach((array) => {
      it(`Should return false for ${array}`, () => {
        const equality = mac.areEqual(...array);
        const incorrectReturn = 'Incorrectly checked equality.';
        expect(equality, incorrectReturn).to.equal(false);
      });
    });
  });


  describe('#reverseMacAddress', () => {
    const macAddress = 'AA:BB:CC:DD:EE:FF';
    const manualReverse = 'FF:EE:DD:CC:BB:AA';
    const reversedMacAddress = mac.reverseMacAddress(macAddress);

    it('Should return a string', () => {
      const notString = 'Doesn\'t return a string';
      expect(reversedMacAddress, notString).to.be.a('string');
    });

    it(`Should return ${manualReverse} for ${macAddress}`, () => {
      const notEqual = `Mac addresses ${manualReverse} and ${reversedMacAddress} are not equal.`;
      expect(mac.areEqual(manualReverse, reversedMacAddress), notEqual).to.equal(true);
    });
  });
});


describe('Converters', () => {
  const containsAll = (arr1, arr2) => {
    const check = arr2.every(arr2Item => arr1.includes(arr2Item));
    return check;
  };

  const sameElements = (arr1, arr2) => {
    const check = containsAll(arr1, arr2) && containsAll(arr2, arr1);
    return check;
  };


  describe('#toArray()', () => {
    const input = 'AA:BB:CC:DD:EE:FF';
    const expOutput = ['AA', 'BB', 'CC', 'DD', 'EE', 'FF'];
    const output = mac.toArray(input);

    it('Should return an array', () => {
      const err = 'Wrong type returned.';
      expect(Array.isArray(output), err).to.equal(true);
    });

    it('Should return the correct array', () => {
      const isCorrect = sameElements(output, expOutput);
      const mismatch = `Mismatch between arrays ${input} and ${expOutput}`;
      expect(isCorrect, mismatch).to.equal(true);
    });
  });


  // TODO: Write test cases for other parameters.
  describe('#toString()', () => {
    const input = new Buffer([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);
    const expOutput = 'AA:BB:CC:DD:EE:FF';
    const output = mac.toString(input);

    it('Should return a string', () => {
      const err = 'Wrong type returned.';
      expect(typeof output, err).to.equal('string');
    });

    it('Should return the correct string', () => {
      const isCorrect = output === expOutput;
      const mismatch = 'Mismatch between input and output';
      expect(isCorrect, mismatch).to.equal(true);
    });
  });


  // TODO: Write test cases for other parameters
  describe('#toBuffer', () => {
    const input = 'AA:BB:CC:DD:EE:FF';
    const expOutput = new Buffer([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);
    const output = mac.toBuffer(input);

    it('Should return a buffer', () => {
      const err = 'Wrong type returned';
      expect(output instanceof Buffer, err).to.equal(true);
    });

    it('Should equal expected output buffer.', () => {
      const isEqual = bufferEqual(output, expOutput);
      const err = `${output.toString('hex')} does not equal expected ${expOutput.toString('hex')}.`;
      expect(isEqual, err).to.equal(true);
    });
  });
});
