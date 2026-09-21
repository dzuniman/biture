const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
    user: "epeccynx",
    password: "EPe@98750!",
    host: "ftp.erp.epec.co.za",
    port: 21,
    localRoot: __dirname + "/dist",
    remoteRoot: "/public_html/erp_epec",
    include: ["*", "**/*"],
    deleteRemote: false,
    overwrite: true,
    forcePasv: true
};

ftpDeploy.deploy(config)
    .then(res => console.log("Epec Production deploy finished:", res))
    .catch(err => console.error(err));
