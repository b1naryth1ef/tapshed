import * as React from 'react';

export enum PageType {
  QUERY,
  SCHEMA,
}

function getPageName(pageType: PageType): string {
  switch (pageType) {
    case PageType.QUERY:
      return 'Query';
    case PageType.SCHEMA:
      return 'Schema';
    default:
      return '';
  }
}

interface NavBarItemProps {
  pageType: PageType;
  parent: NavBar;
}

class NavBarItem extends React.Component {
  props: NavBarItemProps;
  parent: NavBar;

  constructor(props: NavBarItemProps) {
    super(props);
    this.parent = props.parent;
  }

  onClick() {
    this.parent.props.setPage(this.props.pageType);
  }

  render() {
    const onClick = this.onClick.bind(this);
    const currentPage = this.props.parent.props.page;

    return (
      <li className={currentPage === this.props.pageType ? 'selected' : ''} onClick={onClick}>
        {getPageName(this.props.pageType)}
      </li>
    );
  }
}

interface NavBarProps {
  page: PageType;
  setPage: (pageType: PageType) => void;
}

export class NavBar extends React.Component {
  props: NavBarProps;

  render() {
    return (
      <div id="nav">
        <ul>
          <NavBarItem pageType={PageType.QUERY} parent={this} />
          <NavBarItem pageType={PageType.SCHEMA} parent={this} />
        </ul>
      </div>
    );
  }
}
