const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy();

const config = {
    user: "ditaudynastyco",
    password: "DitauEntle01",
    host: "ftp.erp.ditaudynasty.co.za",
    port: 21,
    localRoot: __dirname + "/dist",
    remoteRoot: "/public_html/erp_ditaudynasty",
    include: ["*", "**/*"],
    deleteRemote: false,
    overwrite: true,
    forcePasv: true
};

ftpDeploy.deploy(config)
    .then(res => console.log("Ditau Production deploy finished:", res))
    .catch(err => console.error(err));
