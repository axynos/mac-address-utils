/**
 * @fileoverview Mac utils
 * @author Silver Sten Kruus
 */


const Promise     = require('bluebird');
const network     = Promise.promisifyAll(require('network'));
const bufferEqual = require('buffer-equal'); // eslint-disable-line no-unused-vars
const buffer      = require('buffer'); // eslint-disable-line no-unused-vars

const bufferLength = 6;


/**
 * Validates the length of the buffer
 * @param  {Buffer} buf    The buffer to validate
 * @param  {number} offset The offset in the buffer
 * @return {undefined}
 */
const validateBufferLength = (buf, offset) => {
  if (buf.length < offset + bufferLength) {
    const errorMessage = `Buffer is not large enough to store a ${bufferLength}-byte MAC address starting at offset [${offset}]. Total length is [${buf.length}]`;
    throw new Error(errorMessage);
  }
};


/**
 * Gets the available interfaces
 * @return {Array} The currently available interfaces
 */
const getInterfaces = async () => {
  let interfaces = [];

  await network.get_interfaces_listAsync()
    .then((interfaceList) => {
      interfaces = interfaceList;
    })
    .catch((err) => { throw err; });

  return interfaces;
};


/**
 * Gets the names of available interfaces
 * @return {Array} The interface names
 */
const getInterfaceNames = async () => {
  let interfaceNames = [];

  await getInterfaces()
    .then((rawInterfaces) => {
      const convertedInterfaces = rawInterfaces.map((item) => {
        const convertedName = item.name;
        return convertedName;
      });
      return convertedInterfaces;
    })
    .then((convertedInterfaces) => { interfaceNames = convertedInterfaces; })
    .catch((err) => { throw err; });
  return interfaceNames;
};


/**
 * Gets the currently active interface
 * @return {Object} The current active interface
 */
const getActiveInterface = async () => {
  let activeInterface = {};
  await network.get_active_interfaceAsync()
    .then((item) => { activeInterface = item; })
    .catch((err) => { throw err; });
  return activeInterface;
};


/**
 * Gets the MAC address of an network interface
 * The default is the currently active interface
 * @param  {Object}  netInterface The desired interface
 * @return {String}               The mac address of the desired interface
 */
const getMacAddress = async (netInterface) => {
  const selectedInterface = netInterface || await getActiveInterface();
  const macAddress = selectedInterface.mac_address;

  return macAddress;
};


/**
 * Constructs a mac address from the given array
 * @param  {Array} array      The input array
 * @param  {String} separator The desired separator
 * @return {String}           The outputted string
 */
const constructMacAddress = (array, separator) => {
  const sep = separator || ':';
  const joinedString = array.join(sep);
  const macAddress = joinedString.toUpperCase();
  return macAddress;
};


/**
 * Checks is the given string is a mac address
 * @param  {String}  macAddress  The input mac address as a string
 * @return {Boolean}             The result of the test
 */
const isMacAddress = (macAddress) => {
  // Can't take credit for this one, stole it off the internet and only modified a bit.
  // Specifically from here: https://stackoverflow.com/a/29228841
  // Thanks, random internet user
  const macRegEx = /^[0-9A-Fa-f]{2}([:-])(?:[0-9A-Fa-f]{2}\1){4}[0-9A-Fa-f]{2}$/;
  return macRegEx.test(macAddress);
};


/**
 * Reverses the given mac address
 * @param  {String} macAddress The given mac address
 * @return {String}            The reversed mac address
 */
const reverseMacAddress = (macAddress) => {
  if (!isMacAddress(macAddress)) throw new Error('Not a valid mac address.');

  const upperCaseMac = macAddress.toUpperCase();

  // Split using either the ':' or '-' char
  const macArray = upperCaseMac.split(/[:-]/);
  return constructMacAddress(macArray.reverse());
};


/**
 * Convert a string-form mac address to array form
 * @param  {[type]} macAddress [description]
 * @return {[type]}            [description]
 */
const toArray = (macAddress) => {
  const upperCaseMac = macAddress.toUpperCase();
  const array = upperCaseMac.split(/[:-]/);
  return array;
};


/**
 * Converts a string-form mac address to a Buffer
 * @param  {String} mac    The input mac
 * @param  {Buffer} buf    The input Buffer
 * @param  {number} offset The offset
 * @return {Buffer}        The output buffer
 */
const toBuffer = (mac, buf, offset) => {
  if (!isMacAddress(mac)) {
    throw new Error('Not a valid mac address.');
  }

  const convertedMac = mac.replace(/[:-]/g, '');
  const bitwiseOffset = ~~offset; // eslint-disable-line no-bitwise
  const tempBuffer    = (Buffer.isBuffer(buf)) ? buf : Buffer.alloc(bufferLength, '00', 'hex');

  validateBufferLength(tempBuffer, bitwiseOffset);

  if (!Buffer.isBuffer(buf)) {
    tempBuffer.write(convertedMac, bitwiseOffset, bufferLength, 'hex');
  }

  return tempBuffer;
};


/**
 * Converts a buffer-form mac to a string
 * @param  {Buffer} buf        The input buffer
 * @param  {number} offset     The offset in the buffer
 * @param  {String} separator  The output address' separator
 * @return {String}            The output mac address
 */
const toString = (buf, offset, separator) => {
  const bitwiseOffset = ~~offset; // eslint-disable-line no-bitwise

  validateBufferLength(buf, bitwiseOffset);

  let values = [];
  for (let i = 0; i < bufferLength; i += 1) {
    const tempByte = buf.readUInt8(bitwiseOffset + i);
    let tempString = tempByte.toString(16);

    // Pad with a zero if length is smaller than expected
    tempString = (tempString.length < 2) ? `0${tempString}` : tempString;

    values = values.concat(tempString);
  }

  return constructMacAddress(values, separator);
};


/**
 * Checks if the given mac addresses are equal
 * @param  {...String|Array<String>} macAddresses The mac addresses to check
 * @return {Boolean}                The result of the check
 */
const areEqual = (...macAddresses) => {
  let equal = true;
  let convertedAddresses = [];

  const containsAll = (arr1, arr2) => {
    const check = arr2.every(arr2Item => arr1.includes(arr2Item));
    return check;
  };

  const sameElements = (arr1, arr2) => {
    const check = containsAll(arr1, arr2) && containsAll(arr2, arr1);
    return check;
  };

  // Convert the input string-form mac addresses to a 2D array.
  macAddresses.forEach((macAddress, index) => {
    if (!isMacAddress(macAddress)) {
      throw new Error(`'${macAddress}'at index ${index} is not a valid Mac address.`);
    }

    convertedAddresses = convertedAddresses.concat([toArray(macAddress)]);
  });

  // Iterate over the arrays in the 2D array and check against first element.
  convertedAddresses.forEach((array) => {
    if (!sameElements(convertedAddresses[0], array)) {
      equal = false;
    }
  });

  return equal;
};

exports = module.exports;

exports.getInterfaces = getInterfaces;
exports.getInterfaceNames = getInterfaceNames;
exports.getActiveInterface = getActiveInterface;
exports.getMacAddress = getMacAddress;
exports.constructMacAddress = constructMacAddress;
exports.isMacAddress = isMacAddress;
exports.areEqual = areEqual;
exports.reverseMacAddress = reverseMacAddress;
exports.toBuffer = toBuffer;
exports.toString = toString;
exports.toArray = toArray;
