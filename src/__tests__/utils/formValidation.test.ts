import { isEmptyNumber, isEmptyString, isValidEmail } from '@/utils/formValidation';

describe('isEmptyString', () => {
  it.each([null, undefined, '', '   ', '\n\t'])('treats %p as empty', value => {
    expect(isEmptyString(value)).toBe(true);
  });

  it('accepts text, including text with surrounding spaces', () => {
    expect(isEmptyString('a')).toBe(false);
    expect(isEmptyString('  a  ')).toBe(false);
  });

  it('does not throw on non-strings', () => {
    expect(isEmptyString(42)).toBe(false);
    expect(isEmptyString({})).toBe(false);
  });
});

describe('isEmptyNumber', () => {
  it.each([undefined, null, ''])('treats %p as empty', value => {
    expect(isEmptyNumber(value)).toBe(true);
  });

  it('treats zero as a real value', () => {
    expect(isEmptyNumber(0)).toBe(false);
    expect(isEmptyNumber('0')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it.each(['a@b.co', 'first.last@example.com', ' padded@x.org '])(
    'accepts %p',
    email => {
      expect(isValidEmail(email)).toBe(true);
    },
  );

  it.each(['', 'plain', 'a@b', '@b.co', 'a@.co', 'a b@c.co', null, undefined, 5])(
    'rejects %p',
    email => {
      expect(isValidEmail(email as never)).toBe(false);
    },
  );
});
