const logger = require("../config/logger");

const User = require("../models/user");
const Role = require("../models/role");
const Permission = require("../models/permission");

const { permissions, roles, users } = require("../config/migrations");

const migrateUsers = async () => {
  logger.info("Checking user migrations...");

  users.forEach(async (user) => {
    const migratedUser = await User.countDocuments({
      username: user.username,
    });

    if (migratedUser === 0) {
      await User.create({
        ...user,
      });
      logger.info(`Completed ${user.username} user migrated!`);
    }
    logger.info("Completed users migrations...");
  });
};

const migratePermissions = async () => {
  // get all permission
  const permissionsInDB = await Permission.find();
  // check if there no migrated permission
  if (permissions.length > permissionsInDB.length) {
    // filter not migrated permissions
    const filteredPermissions = permissions.filter(
      (permissionName) =>
        permissionsInDB.findIndex(
          (permissionInDB) => permissionInDB.name === permissionName
        ) === -1
    );
    // migrate filtered permissions
    try {
      await Permission.insertMany(
        filteredPermissions.map((permissionName) => ({
          name: permissionName,
        }))
      );
      logger.info("Permissions are migrated...");
      // return;
    } catch (error) {
      logger.info(`Error migrating permissions: ${error}`);
    }
  } else {
    logger.info("Noting migrated from permissions.");
  }
};

const migrateRoles = async () => {
  await Object.keys(roles).forEach(async (key) => {
    const countedRolesInDB = await Role.countDocuments({ name: key });
    if (countedRolesInDB === 0) {
      logger.info("Found new role...");
      const permissions = await Permission.find({
        name: { $in: roles[key] },
      });

      try {
        await Role.create({
          name: key,
          permissions: permissions.map((permission) => permission._id),
        });
        logger.info(`Completed ${key} role migrated!`);
      } catch (error) {
        logger.info(`Error migrating role: ${error}`);
      }
    }
  });
};

module.exports = { migratePermissions, migrateRoles, migrateUsers };