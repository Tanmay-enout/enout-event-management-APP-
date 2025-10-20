import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { api } from './api';

export function useAuthGate() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Check if user is authenticated by trying to get invite
        const inviteResponse = await api.getInvite();
        
        if (inviteResponse.inviteStatus === 'pending') {
          // User is authenticated but invite is pending
          router.replace('/(public)/invite');
        } else if (inviteResponse.inviteStatus === 'accepted') {
          // Check if tasks are complete
          const tasksComplete = await checkTasksComplete();
          
          if (tasksComplete) {
            // All tasks done, go to main app
            router.replace('/(app)/inbox');
          } else {
            // Tasks incomplete, go to tasks
            router.replace('/(public)/tasks');
          }
        } else {
          // Not authenticated, stay on current screen
          console.log('User not authenticated, staying on current screen');
        }
      } catch (error) {
        console.error('Auth gate error:', error);
        // If there's an error, assume not authenticated
      }
    };

    checkAuthAndRedirect();
  }, [router]);
}

async function checkTasksComplete(): Promise<boolean> {
  try {
    // Check actual user profile to determine task completion status
    const profileResponse = await api.getMe();
    
    if (profileResponse.ok && profileResponse.data) {
      // Based on profile data, determine if all required tasks are complete
      // This is a simplified check - in reality, you'd check specific fields
      const profile = profileResponse.data as any;
      
      // For now, assume tasks are complete if we can get the profile
      // In a real implementation, you'd check specific fields like:
      // - ID upload status
      // - Registration form completion
      // - Phone verification status
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking tasks:', error);
    return false;
  }
}
