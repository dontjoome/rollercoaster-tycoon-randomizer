/// <reference path="CCHandlers.ts" />

let cc_sock: Socket = null;
let cc_good: boolean = false;
let cc_reconnect_interval: number = null;

function cc_onError(hadError: boolean) {
    console.log('error in Crowd Control connection, will keep trying...');
    if(cc_good) {
        park.postMessage(
            {type: 'blank', text: 'error in Crowd Control connection, will keep trying...'} as ParkMessageDesc
        );
    }
    cc_good = false;
    cc_connect();
}

function cc_onClose(hadError: boolean) {
    console.log('Crowd Control connection closed, will keep trying...');
    if(cc_good) {
        park.postMessage(
            {type: 'blank', text: 'Crowd Control connection closed, will keep trying...'} as ParkMessageDesc
        );
    }
    cc_good = false;
    cc_connect();
}

function cc_reconnect() {
    //console.log('Crowd Control reconnecting...');
    cc_connect();
}

function cc_onData(message: string) {
    let data: Object = null;
    let resp: Object = null;

    try {
        // chop off the null-terminator
        while(message[message.length-1] == '\0')
            message = message.substring(0, message.length-1);
        data = JSON.parse(message);
        console.log("Crowd Control received data: ", data);
    } catch(e) {
        printException('error parsing Crowd Control request JSON: ' + message, e);
    }

    try {
        resp = cc_req(data);
    } catch(e) {
        printException('error handling Crowd Control request: ' + message, e);
    }

    try {
        let r: string = JSON.stringify(resp) + '\0';
        console.log(message, r.length, r);
        cc_sock.end(r);
        cc_connect();
    } catch(e) {
        printException('error sending Crowd Control response to: ' + message, e);
    }
}

function cc_connect() {
    if(cc_reconnect_interval !== null) {
        context.clearInterval(cc_reconnect_interval);
        cc_reconnect_interval = null;
    }

    if (network.mode == "server") {
        //console.log("This is a server...");
    } else if (network.mode == "client") {
        //console.log("This is a client...");
        return;
    } else {
        //console.log("This is single player...");
    }

    cc_reconnect_interval = context.setInterval(cc_reconnect, 15000);

    if(cc_sock) { 
        cc_sock.off('error', cc_onError);
        cc_sock.off('close', cc_onClose);
        cc_sock.end();
        cc_sock.destroy(null);
    }

    cc_sock = network.createSocket();

    cc_sock.connect(43385, '127.0.0.1', function() {
        if(!cc_good) {
            console.log('Crowd Control connected!');
            park.postMessage(
                {type: 'blank', text: 'Crowd Control connected!'} as ParkMessageDesc
            );
        }
        cc_good = true;
    });
    cc_sock.setNoDelay(true);

    cc_sock.on('error', cc_onError);
    cc_sock.on('close', cc_onClose);
    cc_sock.on('data', cc_onData);
}

function init_crowdcontrol() {
    cc_connect();

    //Handle renames as guests enter the park
    /*context.subscribe("guest.generation", (e) => {
        if (peepQueue.length > 0) {
            const peep = map.getEntity(e);
            if (peep != null && peep.type == "peep" && (peep as Peep).peepType == "guest") {
                context.executeAction("guestsetname", {
                    peep: peep.id,
                    name: peepQueue[0]
                }, noop);

                park.postMessage({
                    type: "peep",
                    text: peepQueue[0] + " has entered the park!",
                    subject: peep.id
                });

                peepQueue.shift();
            }
        }
    });*/

    context.registerAction("guestSetColor", (args: any) => {
        return {};
    }, (args: any) => {
        const peeps = map.getAllEntities("peep");
        const color = args.color;
        for (let i = 0; i < peeps.length; i++) {
            const peep = peeps[i];
            if (peep.peepType == "guest") {
                (peep as Guest).tshirtColour = color;
                (peep as Guest).trousersColour = color;
            }
        }
        return {};
    });

    context.registerAction("guestAddMoney", (args: any) => {
        return {}
    }, (args: any) => {
        const peeps = map.getAllEntities("peep");
        for (let i = 0; i < peeps.length; i++) {
            const peep = peeps[i];
            if (peep.peepType == "guest") {
                let cash = (peep as Guest).cash + args.money;
                if (cash < 0) {
                    cash = 0;
                } else if (cash > 1000) {
                    cash = 1000;
                }
                (peep as Guest).cash = cash;
            }
        }
        return {};
    });

    context.registerAction("killPlants", (args: any) => { return {} }, (args: any) => {
        for (let y = 0; y < map.size.y; y++) {
            for (let x = 0; x < map.size.x; x++) {
                const tile = map.getTile(x, y);
                for (var i = 0; i < tile.numElements; i++) {
                    const element = tile.getElement(i);
                    if (element.type == "small_scenery") {
                        (element as SmallSceneryElement).age = 100;
                    }
                }
            }
        }
        return {};
    });

    context.registerAction("breakThings", (args: any) => { return {} }, (args: any) => {
        for (let y = 0; y < map.size.y; y++) {
            for (let x = 0; x < map.size.x; x++) {
                const tile = map.getTile(x, y);
                for (var i = 0; i < tile.numElements; i++) {
                    const element = tile.getElement(i);
                    if (element.type == "footpath") {
                        (element as FootpathElement).isAdditionBroken = (context.getRandom(0, 10) == 0);
                    }
                }
            }
        }
        return {};
    });
}

function cc_req(data) {
    const Success = 0;
    const Failed = 1;
    const NotAvail = 2;
    const TempFail = 3;

    /*park.postMessage(
        {type: 'blank', text: data.viewer + ' used ' + data.code} as ParkMessageDesc
    );*/

    return { id: data.id, status: handle(data) };
}
