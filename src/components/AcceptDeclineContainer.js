import React from 'react';
import { AcceptReferral } from './AcceptReferral';
import { DeclineReferral } from './DeclineReferral';
import {Grid} from 'semantic-ui-react';

export const AcceptDeclineContainer = () => {
    return (
    	<div>
       		<AcceptReferral />
       		<DeclineReferral />
       	</div>
    );
};