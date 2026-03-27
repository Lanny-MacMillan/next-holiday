// Store active connections for each user
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Utility function to send notification to specific user
export function sendNotificationToUser(userId: string, notification: any) {
  const userConnections = connections.get(userId);

  if (!userConnections || userConnections.size === 0) {
    console.log(`No active SSE connections for user: ${userId}`);
    return false;
  }

  const message = `data: ${JSON.stringify(notification)}\n\n`;
  let successCount = 0;

  // Send to all active connections for this user (multiple tabs/windows)
  userConnections.forEach(controller => {
    try {
      controller.enqueue(message);
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

  console.log(
    `📡 Sent notification to ${successCount} connections for user: ${userId}`,
  );
  return successCount > 0;
}

// Utility function to get connection count (for debugging)
export function getConnectionStats() {
  const stats = {
    totalUsers: connections.size,
    totalConnections: Array.from(connections.values()).reduce(
      (sum, conns) => sum + conns.size,
      0,
    ),
    userConnections: Object.fromEntries(
      Array.from(connections.entries()).map(([userId, conns]) => [
        userId,
        conns.size,
      ]),
    ),
  };

  return stats;
}

// Export connections map for use in route handler
export { connections };