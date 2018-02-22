import * as React from 'react';

interface ConnectionFormProps {
  connect: (url: string, username: string | null, password: string | null) => null;
}

interface ConnectionFormState {
  url: string;
  username: string;
  password: string;
}

class ConnectionForm extends React.Component {
  props: ConnectionFormProps;
  state: ConnectionFormState;

  constructor(props: ConnectionFormProps) {
    super(props);
    this.state = {
      url: 'http://localhost:8123',
      username: '',
      password: '',
    };
  }

  onSubmit(e: any) {
    e.preventDefault();
    this.props.connect(this.state.url, this.state.username || null, this.state.password || null);
  }

  onChange(e: any) {
    let state = {};
    state[e.target.id] = e.target.value;
    this.setState(state);
  }

  render() {
    const onSubmit = this.onSubmit.bind(this);
    const onChange = this.onChange.bind(this);

    return (
      <form role="form" className="form-horizontal" id="connection_form" onSubmit={onSubmit}>
        <div style={{display: 'block'}}>
          <div className="form-group">
            <label className="col-sm-3 control-label">URL</label>
            <div className="col-sm-9">
              <input id="url" type="text" className="form-control" onChange={onChange} value={this.state.url} />
            </div>
          </div>
          <div className="form-group">
            <label className="col-sm-3 control-label">Username</label>
            <div className="col-sm-9">
              <input
                id="username"
                type="text"
                className="form-control"
                onChange={onChange}
                value={this.state.username}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="col-sm-3 control-label">Password</label>
            <div className="col-sm-9">
              <input
                id="password"
                type="password"
                className="form-control"
                onChange={onChange}
                value={this.state.password}
              />
            </div>
          </div>
        </div>
        <div className="form-group">
            <div className="col-sm-12">
              <button className="btn btn-block btn-primary" disabled={!this.state.url}>Connect</button>
            </div>
          </div>
      </form>
    );
  }
}

interface ConnectionDialogProps {
  connect: (url: string, username: string | null, password: string | null) => null;
}

export class ConnectionDialog extends React.Component {
  props: ConnectionDialogProps;

  render() {
    return (
      <div id="connection_window" style={{display: 'block'}}>
        <div className="connection-settings">
          <h1>taphouse</h1>
          <ConnectionForm connect={this.props.connect} />
        </div>
      </div>
    );
  }
}
