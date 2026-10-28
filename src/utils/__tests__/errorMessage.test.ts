import { errorMessage } from '../errorMessage';

describe('errorMessage', () => {
  it('reads the message of an Error', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it("reads the message of a thunk's serialized error", () => {
    expect(errorMessage({ name: 'Error', message: 'Forbidden' })).toBe('Forbidden');
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'boom'],
    ['a number', 500],
    ['an object without a message', { code: 1 }],
    ['an empty message', { message: '' }],
    ['a non-string message', { message: 42 }],
  ])('falls back for %s', (_, value) => {
    expect(errorMessage(value)).toBe('Unknown error');
  });
});
