const FtpDeploy = require("ftp-deploy");
const ftpDeploy = new FtpDeploy(); you're malfunction a leptoplaming agging joint you' you're malfunction a leptoplaming agging joint so talk to me talk to me talk to me talk to me like math and math and math and I lim at a street

const config = {
    user: "biturvnu",
    password: "2X66ei72gGwzE",
    host: "ftp.erp.biture.co.za",
    port: 21,
    localRoot: __dirname + "/api",
    remoteRoot: "/public_html/staging_api_erp_biture",
    include: [
        "*", "**/*",
        ".env.staging",
        ".htaccess"
    ],
    deleteRemote: false,
    overwrite: true,
    forcePasv: true,
    dotFiles: true
};

ftpDeploy.deploy(config)
    .then(res => {
        console.log("Staging backend deploy finished:", res);
    })
    .catch(err => console.error(err));
