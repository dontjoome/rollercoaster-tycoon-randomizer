/// <reference path="../../lib/openrct2.d.ts" />


function archipelagoGui(){
    var ww = 350;
    var wh = 350;
    let y = 0;

    var onStart = function() {
        console.log('This is where we connect to Archipelago and set up the game.');
        //TODO: Get seed from Archipelago
        setGlobalSeed(1337['text']);//Using a filler here until I get websocket support working
        //TODO: Set Difficulty from Archipelago
        //TODO: Get Range from Archipelago
        //TODO: Get Length from Archipelago
        //TODO: Get Ride Types from Archipelago
        //TODO: Get Park Flags from Archipelago
        //TODO: Get Park Values from Archipelago
        //TODO: Get Goals from Archipelago
        //No need for research, since we're using a different system entirely for that
        settings.rando_research = false;
        //Crowd control has a lot of options that would most likely break Archipelago. We're going to disable both at once until further notice.
        //TODO: Get reroll frequency from Archipelago
        //TODO: Get DeathLink toggle from Archipelago
        settings.archipelago_deathlink = true; //Change this line once actual Archipelago code is implemented
        settings.archipelago_deathlink_timeout = false;
        //TODO: Get Locations list from Archipelago
        //Until these are implemented, we're going to stick with default values, which should be good enough for debugging
        //We're going to track the objectives ourselves instead
        scenario.objective.type = "haveFun";
        //Subscribe to necessary events
        let Archipelago = GetModule("RCTRArchipelago") as RCTRArchipelago;
        context.subscribe("interval.day", ()=>{Archipelago.SetArchipelagoResearch(); Archipelago.CheckObjectives(); Archipelago.SetNames();});
        // we need to unpause the game in order for the next tick to run
        var wasPaused = UnpauseGame();
        runNextTick(function() {
            initRando();
            if(wasPaused.wasPaused && global_settings.auto_pause) {
                // we know the game is currently unpaused because we're inside a tick event
                // so we don't need the fancy PauseGame function
                context.executeAction('pausetoggle', {});
            }
        createChangesWindow();
        });
    }

    var window = ui.openWindow({
        classification: 'archipelago-connect',
        title: "Archipelago Connection",
        width: ww,
        height: wh,
        widgets: [].concat(
            NewLabel('Your plugin.store.json file is ready. Provide this to the host of your Archipelago game along with your .yaml file.', {
                name: 'Instructions',
                y: y++,
                width: 2,
                tooltip: 'For more information, visit archipelago.gg/tutorial'
            }),
            NewEdit('Server Address:', {
                name: 'server-address',
                y: y++,
                text: '',
                tooltip: 'Enter the server address and port (e.g. archipelago.gg:53055)'
            }),
            NewEdit('Slot Name:', {
                name: 'slot-name',
                y: y++,
                text: '',
                tooltip: 'Enter your slot name'
            }),
            NewEdit('Server Password:', {
                name: 'server-password',
                y: y++,
                text: '',
                tooltip: 'Enter the server password, if there is one'
            }),
            [{
                type: 'button',
                name: 'cancel-button',
                x: ww - 90 - 6,
                y: wh - 6 - 26 - 29,
                width: 90,
                height: 26,
                text: 'Cancel',
                tooltip: 'Cancels the Archipelago game and set up a local randomizer',
                onClick: function() {
                    startGameGui();
                    settings.rando_archipelago = false;
                    window.close();
                }
            },
            {
                type: 'button',
                name: 'connect-button',
                x: ww - 90 - 6,
                y: wh - 6 - 26,
                width: 90,
                height: 26,
                text: 'Connect to Server',
                onClick: function() {
                    //TODO: Create function connecting to the Archipelago server
                    window.close();
                }
            },
            {
                type: 'button',
                name: 'start-button',
                x: ww - 90 - 88 - 6,
                y: wh - 6 - 26 - 29,
                width: 85,
                height: 26,
                text: 'Start Game!',
                tooltip: 'Starts your game of Archipelago!',
                onClick: function() {
                    onStart();
                    console.log("At this point, the user should be playing Archipelago! This only needs to be clicked once per multiworld");
                    window.close();
                }
            },
            ]
        )
    });
    return window;
}

function archipelagoLocations(){
    var ww = 700;
    var wh = 350;
    let y = 0;

    var Archipelago = GetModule("RCTRArchipelago") as RCTRArchipelago;
    var messageLog = context.getParkStorage().get("RCTRando.MessageLog") as Array<any>;

    if(!ui.getWindow("archipelago-locations")){
        var window = ui.openWindow({
            classification: 'archipelago-locations',
            title: "Welcome to the Unlock Shop!",
            width: ww,
            height: wh,
            onTabChange: () => {
                var currentWindow = ui.getWindow("archipelago-locations");
                if (currentWindow.tabIndex == 0){
                    currentWindow.findWidget<ListViewWidget>("locked-location-list").items = Archipelago.CreateLockedList();
                }
                else if (currentWindow.tabIndex == 1){
                    currentWindow.findWidget<ListViewWidget>("unlocked-location-list").items = Archipelago.CreateUnlockedList();
                }
                else if (currentWindow.tabIndex == 2){
                    currentWindow.findWidget<ListViewWidget>("objective-list").items = Archipelago.CreateObjectiveList();
                }
                else{
                    currentWindow.findWidget<ListViewWidget>("message-list").items = context.getParkStorage().get("RCTRando.MessageLog") as Array<any>;
                    currentWindow.findWidget<CheckboxWidget>("park-message-toggle").isChecked = settings.archipelago_park_message_chat;
                    currentWindow.findWidget<CheckboxWidget>("network-chat-toggle").isChecked = settings.archipelago_network_chat;
                }
            },
            tabs:
            [
                {
                    image: {frameBase: 80246,frameCount: 14,frameDuration: 4},
                    widgets: [].concat
                    (
                        [
                            {
                                type: 'label',
                                name: 'Locked-Location-Label',
                                x: 250,
                                y: 50,
                                width: 100,
                                height: 26,
                                text: 'Locked Checks',
                                tooltip: 'Buying these will help somebody in the multiworld!'
                            },
                            {
                                type: 'listview',
                                name: 'locked-location-list',
                                x: 25,
                                y: 75,
                                width: 650,
                                height: 200,
                                isStriped: true,
                                items: Archipelago.CreateLockedList(),
                                scrollbars: 'none',
                                onClick: (item: number) => Archipelago.PurchaseItem((item - item %2) / 2)
                            },
                            {
                                type: 'button',
                                name: 'debug-button',
                                x: 300,
                                y: 300,
                                width: 100,
                                height: 26,
                                text: 'Colbys Debug Button. No Touchy!',
                                onClick: function() {
                                    console.log("dangit");
                                    //console.log(map.getAllEntities('car')[1]);
                                    // for (var i = 0; i < map.numEntities; i++) {//get every entity on the map
                                    //     console.log(map.getEntity(i));//load data for the entity;

                                }
                            }
                        ]
                    )
                },
                {
                    image: {frameBase: 5442,frameCount: 16,frameDuration: 4},
                    widgets: [].concat
                    (
                        [
                            {
                                type: 'label',
                                name: 'Unlocked-Location-Label',
                                x: 125,
                                y: 50,
                                width: 100,
                                height: 26,
                                text: 'Unlocked Checks',
                                tooltip: 'Thank you for your purchases! No refunds!'
                            },
                            {
                                type: 'listview',
                                name: 'unlocked-location-list',
                                x: 25,
                                y: 75,
                                width: 650,
                                height: 200,
                                isStriped: true,
                                items: Archipelago.CreateUnlockedList()
                            },
                            {
                                type: 'button',
                                name: 'debug-button',
                                x: 125,
                                y: 300,
                                width: 100,
                                height: 26,
                                text: 'Colbys Debug Button. No Touchy!',
                                onClick: function() {
                                    scenario.objective.type = "haveFun";


                                }
                            }
                        ]
                    )
                },
                {
                    image: {frameBase: 80276,frameCount: 15,frameDuration: 4},
                    widgets: [].concat
                    (
                        [

                            {
                                type: 'label',
                                name: 'Goal',
                                x: 45,
                                y: 60,
                                width: 1000,
                                height: 56,
                                text: "Your goal, should you choose to accept it, is to build a grand theme park featuring - at minimum - the following attributes:",
                                tooltip: 'If you have deathlink on... good luck'
                            },
                            {
                                type: 'listview',
                                name: 'objective-list',
                                x: 25,
                                y: 75,
                                width: 650,
                                height: 200,
                                isStriped: true,
                                scrollbars: 'none',
                                items: Archipelago.CreateObjectiveList()
                            }
                        ]
                    )
                },
                {
                    image: {frameBase: 80055,frameCount: 8,frameDuration: 4},
                    widgets: [].concat
                    (
                        [
                            {
                                type: 'label',
                                name: 'Message-Log-Label',
                                x: 250,
                                y: 50,
                                width: 100,
                                height: 26,
                                text: 'Message Log',
                                tooltip: "Y'all's sure do talk a lot, don't you?"
                            },
                            {
                                type: 'listview',
                                name: 'message-list',
                                x: 25,
                                y: 75,
                                width: 650,
                                height: 200,
                                isStriped: false,
                                items: (messageLog ? messageLog : []),
                                scrollbars: 'both',
                                columns:[{width: 1400}]
                            },
                            {
                                type: 'textbox',
                                name: 'chatbox',
                                text: 'Type your message here!',
                                maxLength: 999,
                                x: 25,
                                y: 275,
                                width: 650,
                                height: 20,
                                tooltip: "You know, not every game lets you type in-game. All I'm saying is that we're better than Ocarina of Time because of this.",
                            },
                            {
                                type: 'button',
                                name: 'send-chat-button',
                                x: 25,
                                y: 300,
                                width: 100,
                                height: 26,
                                text: 'Send Message!',
                                tooltip: 'The shortcut to this button is alt-F4',
                                onClick: function() {
                                    var currentWindow = ui.getWindow("archipelago-locations");
                                    var message = currentWindow.findWidget<TextBoxWidget>("chatbox").text;
                                    if (!message)
                                    return;
                                    archipelago_print_message(message);
                                    currentWindow.findWidget<TextBoxWidget>("chatbox").text = '';
                                }
                            },
                            {
                                type: 'checkbox',
                                name: 'park-message-toggle',
                                text: 'Print Archipelago Chat to Park Messages',
                                x: 400,
                                y: 310,
                                width: 240,
                                height: 10,
                                tooltip: 'Prints Archipelago chats and messages as in game notifications. If your group is chatty, this could be annoying',
                                isChecked: settings.archipelago_park_message_chat,
                                onChange: function(isChecked) {
                                    var currentWindow = ui.getWindow("archipelago-locations");
                                    settings.archipelago_park_message_chat = isChecked;
                                    currentWindow.findWidget<CheckboxWidget>("park-message-toggle").isChecked = isChecked;
                                }
                            },
                            {
                                type: 'checkbox',
                                name: 'network-chat-toggle',
                                text: "Print Archipelago Chat to Network Messages",
                                x: 400,
                                y: 330,
                                width: 220,
                                height: 10,
                                tooltip: 'Prints Archipelago chats and messages as network chats. This will not work in single player mode',
                                isChecked: settings.archipelago_network_chat,
                                onChange: function(isChecked) {
                                    var currentWindow = ui.getWindow("archipelago-locations");
                                    settings.archipelago_network_chat = isChecked;
                                    currentWindow.findWidget<CheckboxWidget>("network-chat-toggle").isChecked = isChecked;
                                }
                            },
                        ]
                    )
                }
            ]
        });
        return window;
    }
}

function archipelagoDebug(){
    var ww = 350;
    var wh = 350;
    let y = 0;

    var window = ui.openWindow({
        classification: 'debug-window',
        title: "Debug Window. You should never see this!",
        width: ww,
        height: wh,
        widgets: [].concat(
            [
                {
                    type: 'button',
                    name: 'debug-button',
                    x: 5,
                    y: 50,
                    width: 200,
                    height: 25,
                    text: 'AddRide (Merry Go Round)',
                    onClick: function() {
                        // network.sendMessage("data.data.text");
                        // console.log(RideType["Merry Go Round"]);
                        
                        // park.cash = 10000;
                        // var i = "Monorail";
                        //console.log(RideType["rollercoaster"]);
                        //console.log(RideType[i]);
                        // console.log(scenario.status);
                        //park.setFlag("scenarioCompleteNameInput",true);
                        //console.log(map.rides[0]);
                        //console.log(RideType["Looping Roller Coaster"].rideType);
                        var BathroomTrap = GetModule("RCTRArchipelago") as RCTRArchipelago;
                        // context.executeAction("landsetrights",{x1:1,y1:1,x2:2,y2:2,setting:4,ownership:7}, () => console.log("I'm so good at this."));
                        // console.log(park.research.inventedItems[0]);
                        BathroomTrap.AddRide(RideType["Merry Go Round"]);
                        // BathroomTrap.AddScenery();
                        // BathroomTrap.GrantDiscount("Land Discount");
                        // park.landPrice = 2000.50;
                        //ac_req({"cmd":"PrintJSON","data":[{"text":"1","type":"player_id"},{"text":" found their "},{"text":"69696969","player":1,"flags":1,"type":"item_id"},{"text":" ("},{"text":"69696969","player":1,"type":"location_id"},{"text":")"}],"type":"ItemSend","receiving":1,"item":{"item":69696969,"location":69696969,"player":1,"flags":1,"class":"NetworkItem"}})
                        // console.log(context.getParkStorage().get('RCTRando.nuttin'));
                        // (BathroomTrap as RCTRArchipelagoConnection).connect();
                        // init_archipelago_connection();
                        
                    }
                },
                {
                    type: 'button',
                    name: 'debug-button2',
                    x: 5,
                    y: 80,
                    width: 200,
                    height: 25,
                    text: 'Receive DeathLink',
                    onClick: function() {
                        // network.sendMessage("data.data.text");
                        // console.log(RideType["Merry Go Round"]);
                        
                        // park.cash = 10000;
                        // var i = "Monorail";
                        //console.log(RideType["rollercoaster"]);
                        //console.log(RideType[i]);
                        // console.log(scenario.status);
                        //park.setFlag("scenarioCompleteNameInput",true);
                        //console.log(map.rides[0]);
                        //console.log(RideType["Looping Roller Coaster"].rideType);
                        var BathroomTrap = GetModule("RCTRArchipelago") as RCTRArchipelago;
                        // context.executeAction('TestAction', (null));
                        ac_req({"cmd":"Bounced","tags":["DeathLink"],"data":{"time":1690148379.2967014,"source":"Colby","cause":"Colby is out of usable Pokémon! Colby blacked out!"}})
                        // console.log(context.getParkStorage().get('RCTRando.nuttin'));
                        // (BathroomTrap as RCTRArchipelagoConnection).connect();
                        // init_archipelago_connection();
                        
                    }
                },
                {
                    type: 'button',
                    name: 'debug-button3',
                    x: 5,
                    y: 110,
                    width: 200,
                    height: 25,
                    text: 'Connected to Archipelago',
                    onClick: function() {
                        // network.sendMessage("data.data.text");
                        // console.log(RideType["Merry Go Round"]);
                        
                        // park.cash = 10000;
                        // var i = "Monorail";
                        //console.log(RideType["rollercoaster"]);
                        //console.log(RideType[i]);
                        // console.log(scenario.status);
                        //park.setFlag("scenarioCompleteNameInput",true);
                        //console.log(map.rides[0]);
                        //console.log(RideType["Looping Roller Coaster"].rideType);
                        // settings.archipelago_park_message_chat = true;
                        var BathroomTrap = GetModule("RCTRArchipelago") as RCTRArchipelago;
                        // BathroomTrap.ReleaseRule("forbidTreeRemoval");
                        // park.setFlag("difficultGuestGeneration", false);
                        // context.registerAction('ExplodeRide', (args) => {return {};}, (args) => explodeRide());
                        ac_req({"cmd":"Connected","team":0,"slot":2,"players":[{"team":0,"slot":1,"alias":"Cool1","name":"Cool1","class":"NetworkPlayer"},{"team":0,"slot":2,"alias":"Test","name":"Test","class":"NetworkPlayer"}],"missing_locations":[81000,81001,81002,81003,81004,81005,81006,81007,81008,81009,81010,81011,81012,81013,81014,81015,81016,81017,81018,81019,81020,81021,81022,81023,81024],"checked_locations":[],"slot_info":{"1":{"name":"Cool1","game":"Clique","type":1,"group_members":[],"class":"NetworkSlot"},"2":{"name":"Test","game":"ChecksFinder","type":1,"group_members":[],"class":"NetworkSlot"}},"hint_points":0,"slot_data":{"world_seed":3098991349,"seed_name":"31784654339393198182","player_name":"Test","player_id":2,"client_version":7,"race":false}})
                        // console.log(context.getParkStorage().get('RCTRando.nuttin'));
                        // (BathroomTrap as RCTRArchipelagoConnection).connect();
                        // init_archipelago_connection();
                        
                    }
                },
                {
                    type: 'button',
                    name: 'debug-button4',
                    x: 5,
                    y: 20,
                    width: 200,
                    height: 25,
                    text: 'Set Game State',
                    onClick: function() {
                        settings.archipelago_location_information = 'Full';
                        archipelago_unlocked_locations = [{LocationID: 0,Item: "Sling Shot",ReceivingPlayer: "Dallin"}, {LocationID: 1,Item: "progressive automation",ReceivingPlayer: "Drew"}, {LocationID: 2,Item: "16 pork chops",ReceivingPlayer: "Minecraft d00ds"}];
                        archipelago_locked_locations = [{LocationID: 3,Item: "Howling Wraiths",ReceivingPlayer: "Miranda"},{LocationID: 4,Item: "Hookshot",ReceivingPlayer: "Dallin"}, {LocationID: 5,Item: "progressive flamethrower",ReceivingPlayer: "Drew"}, {LocationID: 6,Item: "egg shard",ReceivingPlayer: "Minecraft d00ds"}, {LocationID: 7,Item: "Descending Dive",ReceivingPlayer: "Miranda"}];
                        archipelago_location_prices = [{LocationID: 0, Price: 500, Lives: 0, RidePrereq: []}, {LocationID: 1, Price: 2500, Lives: 0, RidePrereq: []},{LocationID: 2, Price: 2500, Lives: 0, RidePrereq: []},{LocationID: 3, Price: 6000, Lives: 0, RidePrereq: []},{LocationID: 4, Price: 4000, Lives: 0, RidePrereq: [2, "gentle",0,0,0,0]},{LocationID: 5, Price: 4000, Lives: 0, RidePrereq: [3, "Looping Roller Coaster", 6.3,0,0,0]},{LocationID: 6, Price: 0, Lives: 200, RidePrereq: []},{LocationID: 7, Price: 10000, Lives: 0, RidePrereq: [1, "Wooden Roller Coaster", 0, 5.0, 7.0, 1000]}];
                        archipelago_objectives = {Guests: [300, false], ParkValue: [0, false], RollerCoasters: [5,2,2,2,0,false], RideIncome: [0, false], ShopIncome: [8000, false], ParkRating: [700, false], LoanPaidOff: [true, false]};
                        context.getParkStorage().set('RCTRando.ArchipelagoLocationPrices', archipelago_location_prices);
                        context.getParkStorage().set('RCTRando.ArchipelagoObjectives', archipelago_objectives);
                        ArchipelagoSaveLocations(archipelago_locked_locations, archipelago_unlocked_locations);
                        // var BathroomTrap = GetModule("RCTRArchipelago");
                        // if(BathroomTrap)
                        // BathroomTrap.ReceiveDeathLink({cause: "Curtis was run over by a train", source: "Curtis"});
                        }
                },
                {
                    type: 'button',
                    name: 'debug-button5',
                    x: 5,
                    y: 140,
                    width: 200,
                    height: 25,
                    text: 'Archipelago Player Completed Goal',
                    onClick: function() {
                        // network.sendMessage("data.data.text");
                        // console.log(RideType["Merry Go Round"]);
                        
                        // park.cash = 10000;
                        // var i = "Monorail";
                        //console.log(RideType["rollercoaster"]);
                        //console.log(RideType[i]);
                        // console.log(scenario.status);
                        //park.setFlag("scenarioCompleteNameInput",true);
                        //console.log(map.rides[0]);
                        //console.log(RideType["Looping Roller Coaster"].rideType);
                        // settings.archipelago_park_message_chat = true;
                        var BathroomTrap = GetModule("RCTRArchipelago") as RCTRArchipelago;
                        // BathroomTrap.ReleaseRule("forbidTreeRemoval");
                        // park.setFlag("difficultGuestGeneration", false);
                        // context.registerAction('ExplodeRide', (args) => {return {};}, (args) => explodeRide());
                        ac_req({"cmd":"PrintJSON","data":[{"text":"Cool1 (Team #1) has completed their goal."}],"type":"Goal","team":0,"slot":1})
                        console.log(context.getParkStorage().get("RCTRando.ArchipelagoPlayers"))
                        // console.log(context.getParkStorage().get('RCTRando.nuttin'));
                        // (BathroomTrap as RCTRArchipelagoConnection).connect();
                        // init_archipelago_connection();
                        
                    }
                },
                {
                    type: 'button',
                    name: 'debug-button6',
                    x: 5,
                    y: 170,
                    width: 200,
                    height: 25,
                    text: 'Release Rule',
                    onClick: function() {
                        // network.sendMessage("data.data.text");
                        // console.log(RideType["Merry Go Round"]);
                        
                        // park.cash = 10000;
                        // var i = "Monorail";
                        //console.log(RideType["rollercoaster"]);
                        //console.log(RideType[i]);
                        // console.log(scenario.status);
                        //park.setFlag("scenarioCompleteNameInput",true);
                        //console.log(map.rides[0]);
                        //console.log(RideType["Looping Roller Coaster"].rideType);
                        // settings.archipelago_park_message_chat = true;
                        var BathroomTrap = GetModule("RCTRArchipelago") as RCTRArchipelago;
                        BathroomTrap.ReleaseRule("forbidTreeRemoval");
                        // park.setFlag("difficultGuestGeneration", false);
                        // context.registerAction('ExplodeRide', (args) => {return {};}, (args) => explodeRide());
                        // ac_req({"cmd":"PrintJSON","data":[{"text":"Cool1 (Team #1) has completed their goal."}],"type":"Goal","team":0,"slot":1})
                        // console.log(context.getParkStorage().get("RCTRando.ArchipelagoPlayers"))
                        // console.log(context.getParkStorage().get('RCTRando.nuttin'));
                        // (BathroomTrap as RCTRArchipelagoConnection).connect();
                        // init_archipelago_connection();
                        
                    }
                },
                {
                    type: 'button',
                    name: 'debug-button7',
                    x: 5,
                    y: 200,
                    width: 200,
                    height: 25,
                    text: '"Grant Discount(Land)"',
                    onClick: function() {
                        // network.sendMessage("data.data.text");
                        // console.log(RideType["Merry Go Round"]);
                        
                        // park.cash = 10000;
                        // var i = "Monorail";
                        //console.log(RideType["rollercoaster"]);
                        //console.log(RideType[i]);
                        // console.log(scenario.status);
                        //park.setFlag("scenarioCompleteNameInput",true);
                        //console.log(map.rides[0]);
                        //console.log(RideType["Looping Roller Coaster"].rideType);
                        // settings.archipelago_park_message_chat = true;
                        var BathroomTrap = GetModule("RCTRArchipelago") as RCTRArchipelago;
                        BathroomTrap.GrantDiscount("Land Discount");
                        // park.setFlag("difficultGuestGeneration", false);
                        // context.registerAction('ExplodeRide', (args) => {return {};}, (args) => explodeRide());
                        // ac_req({"cmd":"PrintJSON","data":[{"text":"Cool1 (Team #1) has completed their goal."}],"type":"Goal","team":0,"slot":1})
                        // console.log(context.getParkStorage().get("RCTRando.ArchipelagoPlayers"))
                        // console.log(context.getParkStorage().get('RCTRando.nuttin'));
                        // (BathroomTrap as RCTRArchipelagoConnection).connect();
                        // init_archipelago_connection();
                        
                    }
                },
                {
                    type: 'button',
                    name: 'debug-button8',
                    x: 5,
                    y: 230,
                    width: 200,
                    height: 25,
                    text: '"Grant Discount(Construction Rights)"',
                    onClick: function() {
                        // network.sendMessage("data.data.text");
                        // console.log(RideType["Merry Go Round"]);
                        
                        // park.cash = 10000;
                        // var i = "Monorail";
                        //console.log(RideType["rollercoaster"]);
                        //console.log(RideType[i]);
                        // console.log(scenario.status);
                        //park.setFlag("scenarioCompleteNameInput",true);
                        //console.log(map.rides[0]);
                        //console.log(RideType["Looping Roller Coaster"].rideType);
                        // settings.archipelago_park_message_chat = true;
                        var BathroomTrap = GetModule("RCTRArchipelago") as RCTRArchipelago;
                        BathroomTrap.GrantDiscount("Construction Rights Discount");
                        // park.setFlag("difficultGuestGeneration", false);
                        // context.registerAction('ExplodeRide', (args) => {return {};}, (args) => explodeRide());
                        // ac_req({"cmd":"PrintJSON","data":[{"text":"Cool1 (Team #1) has completed their goal."}],"type":"Goal","team":0,"slot":1})
                        // console.log(context.getParkStorage().get("RCTRando.ArchipelagoPlayers"))
                        // console.log(context.getParkStorage().get('RCTRando.nuttin'));
                        // (BathroomTrap as RCTRArchipelagoConnection).connect();
                        // init_archipelago_connection();
                        
                    }
                }
           ]
        )
    });
    return window;
}

function test(){
    console.log("At least I got this far");
}