import React from 'react';
import { AcceptReferral } from './AcceptReferral';
import { DeclineReferral } from './DeclineReferral';

export class AcceptDeclineContainer extends React.Component{
    render(){
	    return (
	    	<div>
	       		<AcceptReferral />
	       		<DeclineReferral />
	       	</div>
	    );
	}
};