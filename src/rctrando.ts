
function initRando() {
    SaveSettings();
    console.log(rando_name+' v'+rando_version
        + ' starting with seed '+globalseed
        + ', api version '+context.apiVersion
        + ', difficulty: '+settings.difficulty
        + ', scenarioLength: '+settings.scenarioLength
    );

    try {
        FirstEntry();
        AnyEntry();
        if(settings.rando_crowdcontrol) {
            init_crowdcontrol();
        }
    } catch(e) {
        printException('error in initRando(): ', e);
    }
}

function SaveSettings() {
    try {
        settings['version'] = rando_version;
        settings['seed'] = globalseed;
        context.getParkStorage().set('RCTRando.settings', settings);
        console.log('just saved data', JSON.stringify(settings));

        context.sharedStorage.set('RCTRando.previous_settings', settings);
    } catch(e) {
        printException('error saving settings: ', e);
    }
}
