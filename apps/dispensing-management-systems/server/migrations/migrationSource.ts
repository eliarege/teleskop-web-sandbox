class CustomMigrationSource {
  getMigrations() {
    // Return a list of migration file names
    return Promise.resolve(['2_test2.js','20240418142551.js','20240507113351_create_master_recipe.js']);
  }

  getMigrationName(migration: any) {
    return migration;
  }

  getMigration(migration: any) {
    return import(`../../server/migrations/${migration}`);
  }
}

export default CustomMigrationSource;
