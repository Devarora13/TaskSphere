const prisma = require('../config/db');
const AppError = require('../utils/appError');

exports.getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  return users;
};

exports.deleteUser = async (userId, adminId) => {
  const targetId = parseInt(userId, 10);
  
  if (targetId === adminId) {
    throw new AppError('Admins cannot delete their own account.', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: targetId }
  });

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Delete the user. Cascading relations in Prisma schema (onDelete: Cascade)
  // will automatically purge their tasks and refresh tokens.
  await prisma.user.delete({
    where: { id: targetId }
  });
};
