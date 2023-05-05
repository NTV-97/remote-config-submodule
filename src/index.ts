import admin from 'firebase-admin';
import fs from 'fs';
import remoteConfig from './JSON/remote_config_izion24dev_531.json';
import { RemoteConfigTemplate } from 'firebase-admin/lib/remote-config/remote-config-api';

const serviceAccount = require('./JSON/assm-react-native-firebase-adminsdk-fdtru-4b5172b5cd.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const getTemplate = async () => {
  try {
    const config = admin.remoteConfig();
    const template = await config.getTemplate();
    const _template: RemoteConfigTemplate = {
      conditions: template.conditions,
      etag: template.etag,
      version: template.version,
      parameters: {},
      parameterGroups: {},
    };
    for (const [key, value] of Object.entries(template.parameters)) {
      if (value.valueType === 'JSON') {
        _template.parameters = {
          ..._template.parameters,
          [key]: {
            ...value,
            defaultValue: {
              // @ts-ignore
              value: JSON.parse(value.defaultValue?.value ?? ''),
            },
          },
        };
      } else {
        _template.parameters = {
          ..._template.parameters,
          [key]: value,
        };
      }
    }
    const templateStr = JSON.stringify(_template, null, 2);
    fs.writeFileSync('src/JSON/remote-config-server.json', templateStr);
  } catch (error) {
    console.error('Unable to get template');
    console.error(error);
  }
};

const publishTemplate = () => {
  const config = admin.remoteConfig();

  let json = {};
  for (const [key, value] of Object.entries(remoteConfig)) {
    if (key !== 'parameters') {
      json = {
        ...json,
        [key]: value,
      };
    } else {
      let parameters = {};
      for (const [_key, _value] of Object.entries(remoteConfig.parameters)) {
        if (_value.valueType === 'JSON') {
          parameters = {
            ...parameters,
            [_key]: {
              ..._value,
              defaultValue: {
                value: JSON.stringify(_value.defaultValue.value, null, 2),
              },
            },
          };
        } else {
          parameters = {
            ...parameters,
            [_key]: _value,
          };
        }
      }
      json = {
        ...json,
        parameters,
      };
    }
  }

  const template = config.createTemplateFromJSON(JSON.stringify(json, null, 2));

  config
    .publishTemplate(template)
    .then((updatedTemplate) => {
      console.log('Template has been published');
      console.log('ETag from server: ' + updatedTemplate.etag);
    })
    .catch((err) => {
      console.error('Unable to publish template.');
      console.error(err);
    });
};

const action = process.argv[2];

(() => {
  if (action && action === 'get-template') {
    return getTemplate();
  }
  if (action && action === 'publish-template') {
    publishTemplate();
  }
  console.error(
    `
Invalid command. Please use one of the following:
ts-node src/index.ts get-template
ts-node src/index.ts publish-template
`,
  );
})();

// if (action && action === 'get-template') {
//   getTemplate();
// } else if (action && action === 'publish-template') {
//   publishTemplate();
// } else {
//   console.log(
//     `
// Invalid command. Please use one of the following:
// ts-node src/index.ts get-template
// ts-node src/index.ts publish-template
// `,
//   );
// }
