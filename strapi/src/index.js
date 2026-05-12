module.exports = {
  async bootstrap({ strapi }) {
    strapi.log.info('Bootstrap: Configuring public API permissions...');

    try {
      // Find the Public role by type
      const publicRole = await strapi
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'public' } });

      if (!publicRole) {
        strapi.log.warn('Bootstrap: Public role not found, skipping');
        return;
      }

      // Get existing permissions for this role
      const existingPerms = await strapi
        .query('plugin::users-permissions.permission')
        .findMany({ where: { role: publicRole.id } });

      const existingActions = new Set(existingPerms.map((p) => p.action));

      // Content types that need public read access
      const contentTypes = [
        'article',
        'episode',
        'liturgy-schedule',
        'page',
        'site-setting',
      ];
      const methods = ['find', 'findOne'];

      const newActions = [];
      for (const ct of contentTypes) {
        for (const method of methods) {
          const action = `api::${ct}.${ct}.${method}`;
          if (!existingActions.has(action)) {
            newActions.push(action);
          }
        }
      }

      if (newActions.length === 0) {
        strapi.log.info('Bootstrap: Public permissions already configured');
        return;
      }

      // Create new permission entries
      const newPermIds = [];
      for (const action of newActions) {
        const perm = await strapi.entityService.create(
          'plugin::users-permissions.permission',
          { data: { action } }
        );
        newPermIds.push(perm.id);
      }

      // Combine existing + new permission IDs and update role
      const allPermIds = [...existingPerms.map((p) => p.id), ...newPermIds];

      await strapi.entityService.update(
        'plugin::users-permissions.role',
        publicRole.id,
        { data: { permissions: allPermIds } }
      );

      strapi.log.info(
        `Bootstrap: Added ${newActions.length} permissions for Public role`
      );
    } catch (err) {
      strapi.log.error('Bootstrap: Failed to configure permissions');
      strapi.log.error(err);
    }
  },
};
