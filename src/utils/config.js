let configFile = null;
let lastFilename = null;

const getConfig = (filename = 'storybook-config.json') =>
  // eslint-disable-next-line implicit-arrow-linebreak, no-async-promise-executor
  new Promise(async (resolve, reject) => {
    if (lastFilename === filename && configFile) {
      resolve(configFile);
    } else if (window && window.parent) {
      lastFilename = filename;
      const url = window.parent.location;
      const pathSegments = url.pathname.split('/').filter((word) => word.length > 1);

      const allLocations = [];
      const counter = pathSegments.length;
      for (let i = 0; i <= counter; i++) {
        allLocations.push(pathSegments.length > 0 ? pathSegments.join('/') : '/');
        pathSegments.pop();
      }

      const multipleFetches = [];
      allLocations.forEach(async (parentPath) => {
        multipleFetches.push(fetch(`${url.protocol}//${url.hostname}:${url.port}/${parentPath}/${filename}`));
      });

      Promise.all(multipleFetches)
        .then((responses) => Promise.all(
          responses.map((response) => {
            if (response.ok) {
              return response.json();
            }
            return reject(new Error('Response not ok'));
          })
        ))
        .then((datas) => {
          datas.forEach((data) => {
            if (data && data.storybook && data.storybook.versions) {
              configFile = data.storybook.versions;
              return resolve(configFile);
            }
            return reject(new Error('Invalid config'));
          });
        })
        .catch(() => {
          reject(new Error('Error getting config'));
        });
    } else {
      reject(new Error('Window not found'));
    }
  });

export default getConfig;
