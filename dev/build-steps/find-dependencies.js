'use strict';

var Jsdom = require('jsdom');
var Lodash = require('lodash');

var BuildHelpers = require('./../build-helpers/build-helpers');
var EsprimaHelpers = require('./../esprima-helpers/esprima-helpers');

var Config = require('./../config');

var ALL_SELECTOR = '*';

function getValidDependenciesOnly(dependencies) {
    var validDependencies = [];

    for (var i = 0; i < dependencies.length; i++) {
        var depName = dependencies[i];

        // Anything that doesn't have at least one ':' in it can be assumed to not
        // be a dependency, since we should have expanded these in a previous step
        if (depName.indexOf(Config.get('componentDelimiter')) !== -1) {
            validDependencies.push(depName);
        }
    }

    return validDependencies;
}

/*
 behaviors
    selector
        behavior-name --> Level 2 depth is only location that may contain dependencies
            values
*/
function findDependencyKeys(objectAST, dependenciesList) {
    EsprimaHelpers.eachObjectProperty(objectAST, function(_0, _1, _2, selectorObject, propObj) {
        if (selectorObject) {
            EsprimaHelpers.eachObjectProperty(selectorObject, function(keyName){
                if (BuildHelpers.doesStringLookLikeDependency(keyName)) {
                    dependenciesList.push(BuildHelpers.dependencyStringToModuleName(keyName));
                }
            });
        }
    });
}

function findDependencies(info, cb) {
    var dependencyTable = {};
    var dependenciesList = [];
    var i;

    for (var moduleName in info.moduleDefinitionASTs) {
        var moduleDefinitionAST = info.moduleDefinitionASTs[moduleName];
        var moduleConfigAST = info.moduleConfigASTs[moduleName] || { properties: [] };

        // Collect dependencies from the definition objects.
        var treeValue;
        EsprimaHelpers.eachObjectProperty(moduleDefinitionAST, function(keyName, _1, actualValue, valueObject) {
            if (keyName === Config.get('treeFacetKeyName')) {
                treeValue = actualValue;
            }
            else {
                if (EsprimaHelpers.isObjectExpression(valueObject)) {
                    // `states` object cannot have any dependencies
                    if (keyName === Config.get('behaviorsFacetKeyName') || keyName === Config.get('eventsFacetKeyName')) {
                        findDependencyKeys(valueObject, dependenciesList);
                    }
                }
            }
        });

        // Collect dependencies from the tree object
        if (treeValue) {

            var virtualDOM = Jsdom.jsdom(treeValue);
            var doc = virtualDOM.defaultView.document;
            var elements = doc.querySelectorAll(ALL_SELECTOR);

            for (i = 0; i < elements.length; i++) {
                var element = elements[i];

                var name = element.tagName.toLowerCase();

                if (BuildHelpers.doesStringLookLikeDependency(name)) {
                    dependenciesList.push(name);
                }
            }
        }

        // During the extract core objects phase, we gathered a hash of explicit
        // dependencies from either the config object (inline) or a
        // framework.json file that is within the .famous folder
        for (var depName in info.explicitDependencies) {
            var depRef = info.explicitDependencies[depName];
            // Note that we overwrite dependencies previously loaded in here,
            // meaning only one dependency version per name
            dependencyTable[depName] = depRef;
        }

        // Check for `extends` key in config, use default extends if key is missing,
        // push values into dependency list
        //
        // TODO: again, use the pre-built config object instead of re-traversing the AST
        var configObject = EsprimaHelpers.getObjectValue(moduleConfigAST);

        var extensions = configObject.extends || Config.get('defaultExtends');

        for (i = 0; i < extensions.length; i++) {
            dependenciesList.push(extensions[i]);
        }
    }

    // Finally, push any gathered dependencies into the table object
    var uniqDependencies = Lodash.uniq(dependenciesList);

    var validDependencies = getValidDependenciesOnly(uniqDependencies);

    for (i = 0; i < validDependencies.length; i++) {
        var dependencyName = validDependencies[i];

        if (!dependencyTable[dependencyName]) {
            dependencyTable[dependencyName] = Config.get('defaultDependencyVersion');
        }
    }

    info.dependencyTable = dependencyTable;

    return cb(null, info);
}

module.exports = findDependencies;
