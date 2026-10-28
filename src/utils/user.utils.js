export const sanitizeUser = (user) => {
    if (!user) return null;
    const { password, password_hash, ...safeUser } = user;
    return safeUser;
};

