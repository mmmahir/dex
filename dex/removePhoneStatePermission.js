const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function removePhoneStatePermission(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    
    // Remove READ_PHONE_STATE permission if present
    if (manifest['uses-permission']) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (permission) => permission.$['android:name'] !== 'android.permission.READ_PHONE_STATE'
      );
    }
    
    return config;
  });
};
