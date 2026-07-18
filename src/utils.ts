import { User } from './types';

/**
 * Returns an appropriate avatar URL based on the user's avatar or selected gender (female, neutral, male)
 */
export function getAvatarUrl(user: User | null | undefined): string {
  if (!user) {
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
  }
  
  let gender = user.gender;
  const avatar = user.avatar;

  // If gender is missing, dynamically detect based on user's name or current default avatar
  if (!gender) {
    const nameLower = (user.name || '').toLowerCase();
    const avatarUrl = (avatar || '');
    
    if (nameLower.includes('antonio') || nameLower.includes('claudio') || nameLower.includes('lucas') || nameLower.includes('roberto') || nameLower.includes('josé') || nameLower.includes('joão') || nameLower.includes('carlos') || nameLower.includes('silva') || nameLower.includes('santos')) {
      gender = 'male';
    } else if (nameLower.includes('mariana') || nameLower.includes('maria') || nameLower.includes('ana') || nameLower.includes('julia') || nameLower.includes('fernanda') || nameLower.includes('costa')) {
      gender = 'female';
    } else if (avatarUrl.includes('1494790108377')) {
      gender = 'female';
    } else if (avatarUrl.includes('1507003211169')) {
      gender = 'male';
    } else {
      gender = 'neutral';
    }
  }

  // Detect default placeholder images from Unsplash
  const isDefaultAvatar = !avatar || 
    avatar.includes('1535713875002-d1d0cf377fde') || 
    avatar.includes('1494790108377-be9c29b29330') || 
    avatar.includes('1507003211169-0a1dd7228f2d') ||
    avatar.includes('1500648767791-00dcc994a43e') ||
    avatar.includes('1534528741775-53994a69daeb');

  if (gender) {
    // If we have a specified gender, we want to respect it
    // But if they have a custom uploaded avatar (like base64 data:image), we must use the custom avatar
    const isCustom = avatar && (avatar.startsWith('data:image') || avatar.startsWith('blob:') || !isDefaultAvatar);
    if (isCustom) {
      return avatar;
    }

    if (gender === 'female') {
      return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80';
    } else if (gender === 'neutral') {
      return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80';
    } else {
      return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
    }
  }

  // Fallback to whatever avatar they have, or general default
  return avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';
}
