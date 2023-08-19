var debugLogService = {
    log: function (...value) {
        if(window.location.includes("localhost:") || window.location.includes("vdev.impactm.net")){
            console.log(value)
        }
    }
}

export { debugLogService }