/*
 * HTML5 GUI Framework for FreeSWITCH - XUI
 * Copyright (C) 2015-2016, Seven Du <dujinfang@x-y-t.cn>
 *
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is XUI - GUI for FreeSWITCH
 *
 * The Initial Developer of the Original Code is
 * Seven Du <dujinfang@x-y-t.cn>
 * Portions created by the Initial Developer are Copyright (C)
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Seven Du <dujinfang@x-y-t.cn>
 *
 *
 */

'use strict';

import React from 'react';
import T from 'i18n-react';
import { Modal, ButtonGroup, Button, Form, FormGroup, FormControl, ControlLabel, Radio, Col } from 'react-bootstrap';
import { Link } from 'react-router';

class NewGateway extends React.Component {
	propTypes: {handleNewGatewayAdded: React.PropTypes.func}

	constructor(props) {
		super(props);

		this.last_id = 0;
		this.state = {errmsg: ''};

		// This binding is necessary to make `this` work in the callback
		this.handleSubmit = this.handleSubmit.bind(this);
	}

	handleSubmit(e) {
		var _this = this;

		console.log("submit...");
		var gw = form2json('#newGatewayForm');
		console.log("gw", gw);

		if (!gw.name || !gw.realm) {
			this.setState({errmsg: "Mandatory fields left blank"});
			return;
		}

		$.ajax({
			type: "POST",
			url: "/api/gateways",
			dataType: "json",
			contentType: "application/json",
			data: JSON.stringify(gw),
			success: function () {
				_this.last_id++;
				gw.id = "NEW" + _this.last_id;
				_this.props["data-handleNewGatewayAdded"](gw);
			},
			error: function(msg) {
				console.error("gateway", msg);
			}
		});
	}

	render() {
		console.log(this.props);

		return <Modal {...this.props} aria-labelledby="contained-modal-title-lg">
			<Modal.Header closeButton>
				<Modal.Title id="contained-modal-title-lg"><T.span text="Create New Gateway" /></Modal.Title>
			</Modal.Header>
			<Modal.Body>
			<Form horizontal id="newGatewayForm">
				<FormGroup controlId="formName">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Name" className="mandatory"/></Col>
					<Col sm={10}><FormControl type="input" name="name" placeholder="gw1" /></Col>
				</FormGroup>

				<FormGroup controlId="formRealm">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Realm" className="mandatory"/></Col>
					<Col sm={10}><FormControl type="input" name="realm" placeholder="example.com" /></Col>
				</FormGroup>

				<FormGroup controlId="formUserame">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Userame" className="mandatory"/></Col>
					<Col sm={10}><FormControl type="input" name="username" placeholder="username" /></Col>
				</FormGroup>

				<FormGroup controlId="formPassword">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Password" className="mandatory"/></Col>
					<Col sm={10}><FormControl type="password" name="password" placeholder="a$veryComplicated-Passw0rd" /></Col>
				</FormGroup>

				<FormGroup controlId="formDescription">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Description"/></Col>
					<Col sm={10}><FormControl type="input" name="description" placeholder="Description ..." /></Col>
				</FormGroup>

				<FormGroup controlId="formRegister">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Register"/></Col>
					<Col sm={10}>
						<Radio name="register" value="true" inline>True</Radio>
						<Radio name="register" value="false" inline>False</Radio>
					</Col>
				</FormGroup>

				<FormGroup>
					<Col smOffset={2} sm={10}>
						<Button type="button" bsStyle="primary" onClick={this.handleSubmit}><T.span text="Save" /></Button>
						&nbsp;&nbsp;<T.span className="danger" text={this.state.errmsg}/>
					</Col>
				</FormGroup>
			</Form>
			</Modal.Body>
			<Modal.Footer>
				<Button onClick={this.props.onHide}>Close</Button>
			</Modal.Footer>
		</Modal>;
	}
}

class EditControl extends FormControl {
	constructor(props) {
		super(props);
	}

	render() {
		const props = Object.assign({}, this.props);
		delete props.edit;

		if (this.props.edit) {
			return <FormControl {...props} />
		}

		return <span>{props.defaultValue}</span>
	}

}

class GatewayPage extends React.Component {
	propTypes: {handleNewGatewayAdded: React.PropTypes.func}

	constructor(props) {
		super(props);

		this.state = {errmsg: '', gw: {}, edit: false};

		// This binding is necessary to make `this` work in the callback
		this.handleSubmit = this.handleSubmit.bind(this);
		this.handleControlClick = this.handleControlClick.bind(this);
	}

	handleSubmit(e) {
		var _this = this;

		console.log("submit...");
		var gw = form2json('#newGatewayForm');
		console.log("gw", gw);

		if (!gw.realm || !gw.name) {
			this.setState({errmsg: "Mandatory fields left blank"});
			return;
		}

		$.ajax({
			type: "POST",
			url: "/api/gateways/" + gw.id,
			headers: {"X-HTTP-Method-Override": "PUT"},
			dataType: "json",
			contentType: "application/json",
			data: JSON.stringify(gw),
			success: function () {
				_this.setState({gw: gw, errmsg: {key: "Saved at", time: Date()}})
			},
			error: function(msg) {
				console.error("route", msg);
			}
		});
	}

	handleControlClick(e) {
		this.setState({edit: !this.state.edit});
	}

	componentDidMount() {
		var _this = this;
		$.getJSON("/api/gateways/" + this.props.params.id, "", function(data) {
			console.log("gw", data);
			_this.setState({gw: data});
		}, function(e) {
			console.log("get gw ERR");
		});
	}

	render() {
		const gw = this.state.gw;
		let save_btn = "";
		let err_msg = "";
		let register = gw.register == "true" ? "Yes" : "No";

		if (this.state.edit) {
			save_btn = <Button><T.span onClick={this.handleSubmit} text="Save"/></Button>

			if (gw.register == "true") {
				register = <span>
					<Radio name="register" value="true" inline defaultChecked>Yes</Radio>
					<Radio name="register" value="false" inline>No</Radio>
				</span>
			} else {
				register = <span>
					<Radio name="register" value="true" inline>Yes</Radio>
					<Radio name="register" value="false" inline defaultChecked>No</Radio>
				</span>
			}

			if (this.state.errmsg) {
				err_msg  = <Button><T.span text={this.state.errmsg} className="danger"/></Button>
			}
		}

		return <div>
			<ButtonGroup className="controls">
				{err_msg} { save_btn }
				<Button><T.span onClick={this.handleControlClick} text="Edit"/></Button>
			</ButtonGroup>

			<h1>{gw.name} <small>{gw.extn}</small></h1>
			<hr/>

			<Form horizontal id="newGatewayForm">
				<input type="hidden" name="id" defaultValue={gw.id}/>
				<FormGroup controlId="formName">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Name" className="mandatory"/></Col>
					<Col sm={10}><EditControl edit={this.state.edit} name="name" defaultValue={gw.name}/></Col>
				</FormGroup>

				<FormGroup controlId="formRealm">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Realm" className="mandatory"/></Col>
					<Col sm={10}><EditControl edit={this.state.edit} name="realm" defaultValue={gw.realm}/></Col>
				</FormGroup>

				<FormGroup controlId="formUsername">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Userame" className="mandatory"/></Col>
					<Col sm={10}><EditControl edit={this.state.edit} name="username" defaultValue={gw.username}/></Col>
				</FormGroup>

				<FormGroup controlId="formPassword">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Password" className="mandatory"/></Col>
					<Col sm={10}><EditControl edit={this.state.edit} name="password" defaultValue={gw.password} type="password"/></Col>
				</FormGroup>

				<FormGroup controlId="formDescription">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Description"/></Col>
					<Col sm={10}><EditControl edit={this.state.edit} name="description" defaultValue={gw.description}/></Col>
				</FormGroup>

				<FormGroup controlId="formRegister">
					<Col componentClass={ControlLabel} sm={2}><T.span text="Register" /> ?</Col>
					<Col sm={10}>{register}</Col>
				</FormGroup>
			</Form>
		</div>
	}
}

class GatewaysPage extends React.Component {
	constructor(props) {
		super(props);
		this.state = { formShow: false, rows: [], danger: false};

		// This binding is necessary to make `this` work in the callback
		this.handleControlClick = this.handleControlClick.bind(this);
		this.handleDelete = this.handleDelete.bind(this);
	}

	handleControlClick(e) {
		var data = e.target.getAttribute("data");
		console.log("data", data);

		if (data == "new") {
			this.setState({ formShow: true});
		}
	}

	handleDelete(e) {
		var id = e.target.getAttribute("data-id");
		console.log("deleting id", id);
		var _this = this;

		if (!this.state.danger) {
			var c = confirm(T.translate("Confirm to Delete ?"));

			if (!c) return;
		}

		$.ajax({
			type: "DELETE",
			url: "/api/gateways/" + id,
			success: function () {
				console.log("deleted")
				var rows = _this.state.rows.filter(function(row) {
					return row.id != id;
				});

				_this.setState({rows: rows});
			},
			error: function(msg) {
				console.error("route", msg);
			}
		});
	}

	handleClick(x) {
	}

	componentWillMount() {
	}

	componentWillUnmount() {
	}

	componentDidMount() {
		var _this = this;
		$.getJSON("/api/gateways", "", function(data) {
			console.log("gw", data)
			_this.setState({rows: data});
		}, function(e) {
			console.log("get gateways ERR");
		});
	}

	handleFSEvent(v, e) {
	}

	handleGatewayAdded(route) {
		var rows = this.state.rows;
		rows.push(route);
		this.setState({rows: rows, formShow: false});
	}

	render() {
		let formClose = () => this.setState({ formShow: false });
		let toggleDanger = () => this.setState({ danger: !this.state.danger });
	    var danger = this.state.danger ? "danger" : "";

		var _this = this;

		var rows = this.state.rows.map(function(row) {
			return <tr key={row.id}>
					<td>{row.id}</td>
					<td><Link to={`/settings/gateways/${row.id}`}>{row.name}</Link></td>
					<td>{row.realm}</td>
					<td>{row.username}</td>
					<td>{row.register}</td>
					<td><T.a onClick={_this.handleDelete} data-id={row.id} text="Delete" className={danger}/></td>
			</tr>;
		})

		return <div>
			<div className="controls">
				<Button><T.span onClick={this.handleControlClick} data="new" text="New" /></Button>
			</div>

			<h1><T.span text="Gateways"/></h1>
			<div>
				<table className="table">
				<tbody>
				<tr>
					<th><T.span text="ID"/></th>
					<th><T.span text="Name"/></th>
					<th><T.span text="Realm"/></th>
					<th><T.span text="Username"/></th>
					<th><T.span text="Register"/></th>
					<th><T.span text="Delete" className={danger} onClick={toggleDanger} title={T.translate("Click me to toggle fast delete mode")}/></th>
				</tr>
				{rows}
				</tbody>
				</table>
			</div>

			<NewGateway show={this.state.formShow} onHide={formClose} data-handleNewGatewayAdded={this.handleGatewayAdded.bind(this)}/>
		</div>
	}
}

export {GatewaysPage, GatewayPage};