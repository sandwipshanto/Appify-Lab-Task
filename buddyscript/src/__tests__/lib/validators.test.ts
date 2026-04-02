import { describe, it, expect } from 'vitest';
import { validateRegistration, validateLogin, validatePost, validateComment } from '@/lib/validators';

describe('validateRegistration', () => {
  it('accepts valid input', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'Test1234',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty firstName', () => {
    const result = validateRegistration({
      firstName: '', lastName: 'Doe', email: 'john@example.com', password: 'Test1234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects weak password', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without numbers', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'abcdefgh',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without letters', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: '12345678',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: 'notanemail', password: 'Test1234',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes email to lowercase', () => {
    const result = validateRegistration({
      firstName: 'John', lastName: 'Doe', email: '  JOHN@Example.COM  ', password: 'Test1234',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe('john@example.com');
  });

  it('trims first and last name', () => {
    const result = validateRegistration({
      firstName: '  John  ', lastName: '  Doe  ', email: 'john@example.com', password: 'Test1234',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.firstName).toBe('John');
      expect(result.data.lastName).toBe('Doe');
    }
  });

  it('rejects firstName over 50 chars', () => {
    const result = validateRegistration({
      firstName: 'A'.repeat(51), lastName: 'Doe', email: 'john@example.com', password: 'Test1234',
    });
    expect(result.success).toBe(false);
  });
});

describe('validateLogin', () => {
  it('accepts valid input', () => {
    const result = validateLogin({ email: 'john@example.com', password: 'Test1234' });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = validateLogin({ email: '', password: 'Test1234' });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = validateLogin({ email: 'john@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('validatePost', () => {
  it('accepts text post', () => {
    const result = validatePost({ content: 'Hello world', visibility: 'PUBLIC' });
    expect(result.success).toBe(true);
  });

  it('rejects empty content without image', () => {
    const result = validatePost({ content: '', visibility: 'PUBLIC' });
    expect(result.success).toBe(false);
  });

  it('accepts empty content with image', () => {
    const result = validatePost({ content: '', visibility: 'PUBLIC', imageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid visibility', () => {
    const result = validatePost({ content: 'Hello', visibility: 'INVALID' });
    expect(result.success).toBe(false);
  });

  it('accepts PRIVATE visibility', () => {
    const result = validatePost({ content: 'Hello', visibility: 'PRIVATE' });
    expect(result.success).toBe(true);
  });

  it('rejects content over 5000 chars', () => {
    const result = validatePost({ content: 'a'.repeat(5001), visibility: 'PUBLIC' });
    expect(result.success).toBe(false);
  });
});

describe('validateComment', () => {
  it('accepts valid comment', () => {
    const result = validateComment({ content: 'Nice post!' });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = validateComment({ content: '' });
    expect(result.success).toBe(false);
  });

  it('rejects content over 2000 chars', () => {
    const result = validateComment({ content: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  it('accepts content at exactly 2000 chars', () => {
    const result = validateComment({ content: 'a'.repeat(2000) });
    expect(result.success).toBe(true);
  });

  it('rejects invalid parentId format', () => {
    const result = validateComment({ content: 'Reply', parentId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('accepts valid parentId', () => {
    const result = validateComment({ content: 'Reply', parentId: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.success).toBe(true);
  });
});
