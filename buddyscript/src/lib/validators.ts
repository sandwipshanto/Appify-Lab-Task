type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function validateRegistration(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): ValidationResult<{ firstName: string; lastName: string; email: string; password: string }> {
  const errors: Record<string, string> = {};
  const firstName = input.firstName?.trim();
  const lastName = input.lastName?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!firstName || firstName.length > 50) errors.firstName = 'First name is required (max 50 chars)';
  if (!lastName || lastName.length > 50) errors.lastName = 'Last name is required (max 50 chars)';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255)
    errors.email = 'Valid email is required';
  if (!password || password.length < 8 || password.length > 128)
    errors.password = 'Password must be 8-128 characters';
  else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    errors.password = 'Password must contain at least one letter and one number';

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { firstName, lastName, email, password } };
}

export function validateLogin(input: { email: string; password: string }): ValidationResult<{ email: string; password: string }> {
  const errors: Record<string, string> = {};
  const email = input.email?.trim().toLowerCase();
  const password = input.password;

  if (!email) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { email, password } };
}

export function validatePost(input: {
  content: string;
  visibility: string;
  imageUrl?: string;
}): ValidationResult<{ content: string; visibility: 'PUBLIC' | 'PRIVATE'; imageUrl?: string }> {
  const errors: Record<string, string> = {};
  const content = input.content?.trim();
  const visibility = input.visibility;
  const imageUrl = input.imageUrl?.trim();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!content && !imageUrl) errors.content = 'Post must have text or an image';
  if (content && content.length > 5000) errors.content = 'Post content max 5000 characters';
  if (visibility !== 'PUBLIC' && visibility !== 'PRIVATE') errors.visibility = 'Visibility must be PUBLIC or PRIVATE';
  if (imageUrl && cloudName && !imageUrl.startsWith(`https://res.cloudinary.com/${cloudName}/`))
    errors.imageUrl = 'Invalid image URL';

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { content: content || '', visibility: visibility as 'PUBLIC' | 'PRIVATE', imageUrl } };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateComment(input: {
  content: string;
  parentId?: string;
}): ValidationResult<{ content: string; parentId?: string }> {
  const errors: Record<string, string> = {};
  const content = input.content?.trim();

  if (!content || content.length < 1) errors.content = 'Comment cannot be empty';
  if (content && content.length > 2000) errors.content = 'Comment max 2000 characters';
  if (input.parentId && !UUID_REGEX.test(input.parentId)) errors.parentId = 'Invalid parent comment ID';

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data: { content, parentId: input.parentId } };
}
