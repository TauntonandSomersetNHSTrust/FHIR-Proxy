/**
 * @author Julian Matthews
 * @description Rewritten from https://github.com/Fdawgs/ydh-fhir-listeners/releases to work within Musgrove Park Hospital.
 * Mirth Connect supports ES6 to a degree but not template literals and const/let.
 */
const localIDtype = 'https://fhir.tst.nhs.uk/Id/local-patient-identifier';
const NHSIDtype = 'https://fhir.nhs.uk/Id/nhs-number';
var SPQuery = '';
try {
	var type = $('fhirType').toLowerCase();
	// Append URL with forward slash and build Java URL object
	var requestURL = $('url');
	if(!requestURL.endsWith('/')) {
		requestURL += '/';
	}
	var bundle = buildBundleResource(new java.net.URI(requestURL));
	/**
     * Coded supported parameters to prevent unsupported searches being completed
     * Once fully fleshed out, it will look similar to the commented block below, but 
     * for the purpose of enabling SIDER, only search via NHS number is configured
     */

	var supportedTypeParams = {
		condition: ['patient'],
		encounter: ['patient'],
		flag: ['patient'],
		patient: ['identifier'],
		procedure: ['patient']
    };
    
    // If any param not supported, reject request
	Object.keys($('parameters')).forEach(function(key) {
		if(supportedTypeParams[type.toLowerCase()].indexOf(''.concat(key.toLowerCase())) < 0) {
			return createOperationOutcome('error', 'invalid', 'Unknown or unsupported parameter '.concat(key, '.'));
		}
	});
	/**
	 * =======================
	 * Condition search params
	 * =======================
	 */
	if(type == 'condition') {
		var patientNHS = "";
		// GET [baseUrl]/Encounter?patient.identifier=[system]|[code]
		if($('parameters').contains('patient.identifier')) {
			if($('parameters').getParameter('patient.identifier').contains('|')) {
				var encounterPatIdParam = String($('parameters').getParameter('patient.identifier')).split('|');
				if(encounterPatIdParam[0] === NHSIDtype) {
					patientNHS = encounterPatIdParam[1];
				}
			}
		}
		SPQuery = SPQuery.concat('@nhsNum =\'', patientNHS, '\'');
	}
	/**
	 * =======================
	 * Encounter search params
	 * =======================
	 */
	if(type == 'encounter') {
		var patientNHS = "";
		// GET [baseUrl]/Encounter?patient.identifier=[system]|[code]
		if($('parameters').contains('patient.identifier')) {
			if($('parameters').getParameter('patient.identifier').contains('|')) {
				var encounterPatIdParam = String($('parameters').getParameter('patient.identifier')).split('|');
				if(encounterPatIdParam[0] === NHSIDtype) {
					var patientNHS = encounterPatIdParam[1];
				}
			}
		}
		var SPQuery = SPQuery.concat('@nhsNum=\'', patientNHS, '\'');
	}
	/**
	 * =======================
	 * Flag search params
	 * =======================
	 */
	if(type == 'flag') {
		var patientNHS = '';
		// GET [baseUrl]/Flag?patient.identifier=[system]|[code]
		if($('parameters').contains('patient.identifier')) {
			if($('parameters').getParameter('patient.identifier').contains('|')) {
				var encounterPatIdParam = String($('parameters').getParameter('patient.identifier')).split('|');
				if(encounterPatIdParam[0] === NHSIDtype) {
					var patientNHS = encounterPatIdParam[1];
				}
			}
		}
		var SPQuery = SPQuery.concat('@nhsNum=\'', patientNHS, '\'');
	}
	/**
	 * =======================
	 * Procedure search params
	 * =======================
	 */
	if(type == 'procedure') {
		var patientNHS = "";
		// GET [baseUrl]/Procedure?patient.identifier=[system]|[code]
		if($('parameters').contains('patient.identifier')) {
			if($('parameters').getParameter('patient.identifier').contains('|')) {
				var encounterPatIdParam = String($('parameters').getParameter('patient.identifier')).split('|');
				if(encounterPatIdParam[0] === NHSIDtype) {
					patientNHS = encounterPatIdParam[1];
				}
			}
		}
		SPQuery = SPQuery.concat('@nhsNum =\'', patientNHS, '\'');
	}
	/**
	 * =====================
	 * Patient search params
	 * =====================
	 */
	if(type == 'patient') {
		var patientNHS = '';
		/**
		 * GET [baseUrl]/Patient?identifier=[system]|[code]
		 * GET [baseUrl]/Patient?identifier=[code]
		 */
		if($('parameters').contains('identifier')) {
			if($('parameters').getParameter('identifier').contains('|')) {
				var encounterPatIdParam = String($('parameters').getParameter('identifier')).split('|');
				if(encounterPatIdParam[0] === NHSIDtype) {
					var patientNHS = encounterPatIdParam[1];
				}
			}
		}
		var SPQuery = SPQuery.concat('@nhsNum=\'', patientNHS, '\'');
	}
	if(SPQuery.length == 0) {
		return createOperationOutcome('error', 'transient', 'Error searching resources.', 500, '');
	}
	var result = buildResourceQuery(type, SPQuery, 'search');
	while(result.next()) {
		var data = void 0;
		switch(''.concat(type)) {
			case 'condition':
				data = buildConditionResource(result);
				break;
			case 'encounter':
				data = buildEncounterResource(result);
				break;
			case 'flag':
				data = buildFlagResource(result);
				break;
			case 'procedure':
				data = buildProcedureResource(result);
				break;
			case 'patient':
				data = buildPatientResource(result);
				break;
			default:
				break;
		} // Add returned FHIR resources to bundle resource
		var resourceOuter = {};
		resourceOuter.resource = data;
		resourceOuter.fullUrl = ''.concat($cfg('apiUrl') + $('contextPath'), '/').concat(data.id);
		bundle.entry.push(resourceOuter);
	}
	bundle.total = bundle.entry.length;
	bundle.link[0].url = $cfg('apiUrl') + $('uri');
	var response = FhirResponseFactory.getSearchResponse(
        JSON.stringify(bundle), 
        200, 
        'application/fhir+json'
        );
	responseMap.put('response', response);
	return response.getMessage();
} catch(error) {
	return createOperationOutcome(
        'error', 
        'transient', 
        'Error searching resources.', 
        500, 
        error
        );
}