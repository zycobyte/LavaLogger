let levels = {0:'info', 1:'warn', 2:'error', 3:'critical', 4:'major', 5:'internal'};
let config;

exports.run = async function (options, c){
    if(!config){
        if(!c) {
            const fs = require('fs');
            let rawdata = fs.readFileSync('../config.json');
            config = JSON.parse(rawdata);
        }else{
            config = c;
        }

        //query database
        let db_type = config.db_type;
        let data = await require(`../database/${db_type}.js`).query(options, config);

        console.log("Returned logs:\n---------------------------------------------------------------------------")

        for(let i in data){
            let log = data[i];
            let trace = (log.trace!=='undefined'?log.trace.replace(/\n\n/g,""):"\nNo trace given.");
            // console.log(log)
            // continue;
            console.log(`
##${levels[log.level]?levels[log.level]+" ("+log.level+")":"ID: "+log.level}##\n
\tApp: ${log.app}, ID: ${log.id}
\tTimestamp:\t${log.timestamp}
\t-> ${log.message}
\tData:\t${log.data}\n${options.use_trace?trace:""}
\n---------------------------------------------------------------------------`)
        }
    }
}


let args = process.argv.slice(2);
function cli(args, c) {
    if (args[0] === '--help') {
        console.log("\n\n\nHelp menu\n-----------\nUsage: node query.js --run [args]\n");
        console.log("Available operations:");
        console.log("-limit=x\t\tSets the limit for rows returned (default 10)");
        console.log("-from=timestamp\t\tSets the minimum timestamp to get logs from");
        console.log("-to=timestamp\t\tSets the maximum timestamp to get logs from");
        console.log("-order=opt\t\tSets the order to start the query.  Available options are ASC and DESC");
        console.log("-level=x\t\tSets a priority level to view.  By default, it will return all errors.");
        // console.log("-remove-level=x\t\tRemoves a priority level from the view.  By default, it will return all levels.");
        console.log("Levels:",{0:'info', 1:'warn', 2:'error', 3:'critical', 4:'major', 5:'internal'});
        console.log("");
        // console.log("--group-logs\t\tGroups the logs into their levels.");
        console.log("--use-trace\t\tShows the traceback to where the line of code is.");
        console.log("--strict\t\tHalts the process if an error occurs.");

    } else if (args[0] === '--run') {
        let data = {limit: 10, level:2, order:"DESC", min:0};
        for(let i in args){
            let arg = args[i];
            if(arg === '--run')continue;

            if(arg.match(/^-limit=[0-9]+$/)){
                data.limit = arg.match(/[0-9]+$/)[0];

            }else if(arg.match(/^-from=[0-9]+$/)){
                data.min = arg.match(/[0-9]+$/)[0];

            }else if(arg.match(/^-to=[0-9]+$/)){
                data.max = arg.match(/[0-9]+$/)[0];

            }else if(arg.match(/^-order=(ASC$)|(DESC$)/)){
                data.order = arg.match(/(ASC$)|(DESC$)/)[0];

            }else if(arg.match(/^-level=[0-9]$/)){
                data.level = arg.match(/[0-9]$/)[0];

            }else if(arg.match(/^-remove-level=[0-9]$/)){
                // data.level = data.level.filter(function(a){return a!==Number(arg.match(/[0-9]$/)[0])});

            }else if(arg.match(/^--use-trace$/)){
                data.use_trace = true;

            }else if(arg.match(/^--group-logs$/)){
                data.group_logs = true;

            }else if(arg.match(/^--strict$/)){
                data.strict_mode = true;

            }else{
                console.log("Error with arg "+arg+".");
                if(args.includes("--strict"))
                    return console.log("Strict mode prevented the command continuing.");
                console.log("Ignoring it and continuing execution.  Use --strict to prevent this.");
            }
        }
        exports.run(data, c);
    } else {
        cli(['--help']);
    }
}
if (args)
    cli(args);