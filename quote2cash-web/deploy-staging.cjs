const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
    user: "biturvnu",
    password: "2X66ei72gGwzE",
    host: "ftp.erp.biture.co.za",
    port: 21,
    localRoot: __dirname + "/dist",
    remoteRoot: "/public_html/staging_erp_biture",
    include: ["*", "**/*"],
    deleteRemote: false,
    forcePasv: true
};

ftpDeploy.deploy(config)
    .then(res => console.log("Staging deploy finished:", res))
    .catch(err => console.error(err));
