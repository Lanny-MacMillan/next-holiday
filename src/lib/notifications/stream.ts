// Store active connections for each user
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Utility function to send notification to specific user
export function sendNotificationToUser(userId: string, notification: any) {
  const userConnections = connections.get(userId);

  if (!userConnections || userConnections.size === 0) {
    return false;
  }

  // Proper SSE encoding format
  const message = `data: ${JSON.stringify(notification)}\n\n`;
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);
  let successCount = 0;

  // Send to all active connections for this user (multiple tabs/windows)
  userConnections.forEach(controller => {
    try {
      controller.enqueue(encodedMessage);
      successCount++;
    } catch (error) {
      console.error('Failed to send SSE message:', error);
      // Remove dead connection
      userConnections.delete(controller);
    }
  });

  // Clean up if no connections left
  if (userConnections.size === 0) {
    connections.delete(userId);
  }

  return successCount > 0;
}

// Export connections map for use in route handler
export { connections };
