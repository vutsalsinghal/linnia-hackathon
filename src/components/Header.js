import React from 'react';
import {Link} from 'react-router-dom';
import { Menu, Modal, Icon } from 'semantic-ui-react';
import { AddReferral } from './AddReferral';

export default () => {
    return (
        <div>
            <Menu style={{ marginTop: '10px' }}>
                <Menu.Item><Link to='/'>Inner Circle</Link></Menu.Item>

                <Menu.Menu position="right">
                    <Menu.Item><Link to='/addEvent'><Icon name='add' />Add Event</Link></Menu.Item>
                </Menu.Menu>
                <Menu.Menu>
                    <Modal trigger={<Menu.Item>Send Referral</Menu.Item>}>
                        <Modal.Header>Give Referrals to Your Friends</Modal.Header>
                        <Modal.Content>
                            <AddReferral />
                        </Modal.Content>
                    </Modal>
                </Menu.Menu>

            </Menu>
        </div>
    );
};
