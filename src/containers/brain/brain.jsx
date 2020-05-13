import React from 'react';
import { Text, Pane, Tablist, Tab } from '@cybercongress/gravity';
import { connect } from 'react-redux';
import { Link, Route } from 'react-router-dom';
import {
  formatNumber,
  getStatistics,
  getValidators,
  statusNode,
  getBalance,
  getTotalEUL,
  getAmountATOM,
  getInlfation,
  getcommunityPool,
  getTxCosmos,
  getTotalSupply,
} from '../../utils/search/utils';
import { roundNumber } from '../../utils/utils';
import { CardStatisics, Loading } from '../../components';
import { cybWon } from '../../utils/fundingMath';
import injectWeb3 from './web3';
import { CYBER, AUCTION, GENESIS_SUPPLY, TAKEOFF } from '../../utils/config';
import { getProposals } from '../../utils/governance';

import ActionBarContainer from './actionBarContainer';
import {
  GovernmentTab,
  MainTab,
  CybernomicsTab,
  KnowledgeTab,
  CommunityTab,
  AppsTab,
  HelpTab,
  PathTab,
} from './tabs';

const { DIVISOR_CYBER_G } = CYBER;

const TabBtn = ({ text, isSelected, onSelect, to }) => (
  <Link to={to}>
    <Tab
      key={text}
      isSelected={isSelected}
      onSelect={onSelect}
      paddingX={5}
      paddingY={20}
      marginX={3}
      borderRadius={4}
      color="#36d6ae"
      boxShadow="0px 0px 5px #36d6ae"
      fontSize="16px"
      whiteSpace="nowrap"
      width="100%"
    >
      {text}
    </Tab>
  </Link>
);

class Brain extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inlfation: 0,
      addressLedger: null,
      linksCount: 0,
      cidsCount: 0,
      accountsCount: 0,
      totalCyb: 0,
      stakedCyb: 0,
      activeValidatorsCount: 0,
      selected: 'main',
      loading: true,
      chainId: '',
      amount: 0,
      takeofPrice: 0,
      capATOM: 0,
      communityPool: 0,
      proposals: 0,
      donation: 0,
      cybernomics: {
        gol: {
          supply: 0,
          price: 0,
          cap: 0,
        },
        eul: {
          supply: 0,
          price: 0,
          cap: 0,
        },
        cyb: {
          supply: 0,
          price: 0,
          cap: 0,
        },
      },
    };
  }

  async componentDidMount() {
    this.chekPathname();
    await this.checkAddressLocalStorage();
    this.getStatisticsBrain();
    // this.getPriceGol();
    this.getTxsCosmos();
    this.getContract();
  }

  componentDidUpdate(prevProps) {
    const { location } = this.props;
    if (prevProps.location.pathname !== location.pathname) {
      this.chekPathname();
    }
  }

  chekPathname = () => {
    const { location } = this.props;
    const { pathname } = location;

    if (
      pathname.match(/cybernomics/gm) &&
      pathname.match(/cybernomics/gm).length > 0
    ) {
      this.select('cybernomics');
    } else if (
      pathname.match(/knowledge/gm) &&
      pathname.match(/knowledge/gm).length > 0
    ) {
      this.select('knowledge');
    } else if (
      pathname.match(/government/gm) &&
      pathname.match(/government/gm).length > 0
    ) {
      this.select('government');
    } else if (
      pathname.match(/community/gm) &&
      pathname.match(/community/gm).length > 0
    ) {
      this.select('community');
    } else if (
      pathname.match(/apps/gm) &&
      pathname.match(/apps/gm).length > 0
    ) {
      this.select('apps');
    } else if (
      pathname.match(/help/gm) &&
      pathname.match(/help/gm).length > 0
    ) {
      this.select('help');
    } else if (
      pathname.match(/path/gm) &&
      pathname.match(/path/gm).length > 0
    ) {
      this.select('path');
    } else {
      this.select('main');
    }
  };

  getContract = async () => {
    const { cybernomics } = this.state;
    const {
      contract: { methods },
    } = this.props;
    const roundThis = await methods.today().call();

    const totalSupplyEul = await getTotalSupply();
    const createOnDay = await methods.createOnDay(roundThis).call();
    const dailyTotals = await methods.dailyTotals(roundThis).call();

    const currentPrice = dailyTotals / (createOnDay * Math.pow(10, 9));
    cybernomics.gol = {
      supply: parseFloat(AUCTION.TOKEN_ALOCATION * CYBER.DIVISOR_CYBER_G),
      price: currentPrice,
      cap: parseFloat(currentPrice * AUCTION.TOKEN_ALOCATION),
    };

    cybernomics.eul = {
      supply: parseFloat(totalSupplyEul),
      price: currentPrice,
      cap: parseFloat((totalSupplyEul / CYBER.DIVISOR_CYBER_G) * currentPrice),
    };

    this.setState({
      cybernomics,
    });
  };

  getTxsCosmos = async () => {
    const dataTx = await getTxCosmos();
    console.log(dataTx);
    if (dataTx !== null) {
      this.getATOM(dataTx.txs);
    }
  };

  getATOM = async dataTxs => {
    const { cybernomics } = this.state;
    let amount = 0;
    let won = 0;
    let currentPrice = 0;

    if (dataTxs) {
      amount = await getAmountATOM(dataTxs);
    }

    console.log('amount', amount);

    won = cybWon(amount);
    if (amount === 0) {
      currentPrice = 0;
    } else {
      currentPrice = amount / won;
    }

    console.log('won', won);
    console.log('currentPrice', currentPrice);

    const supplyEUL = parseFloat(GENESIS_SUPPLY);
    const takeoffPrice = currentPrice * DIVISOR_CYBER_G;
    const capATOM = (supplyEUL / DIVISOR_CYBER_G) * takeoffPrice;
    console.log('capATOM', capATOM);

    cybernomics.cyb = {
      cap: capATOM,
      price: takeoffPrice,
      supply: GENESIS_SUPPLY,
    };

    const donation = amount / TAKEOFF.ATOMsALL;

    this.setState({
      cybernomics,
      donation,
    });
  };

  checkAddressLocalStorage = async () => {
    let address = [];

    const localStorageStory = await localStorage.getItem('ledger');
    if (localStorageStory !== null) {
      address = JSON.parse(localStorageStory);
      console.log('address', address);
      this.setState({ addressLedger: address });
      this.getAddressInfo();
    } else {
      this.setState({
        addAddress: true,
        loading: false,
      });
    }
  };

  getAddressInfo = async () => {
    const { addressLedger } = this.state;
    const addressInfo = {
      address: '',
      amount: '',
      token: '',
      keys: '',
    };
    let total = 0;

    const result = await getBalance(addressLedger.bech32);
    console.log('result', result);

    if (result) {
      total = await getTotalEUL(result);
    }
    this.setState({
      addAddress: false,
      loading: false,
      // addressInfo,
      amount: total.total,
    });
  };

  getStatisticsBrain = async () => {
    const statisticContainer = await getStatistics();
    const validatorsStatistic = await getValidators();
    const status = await statusNode();
    const dataInlfation = await getInlfation();
    const dataCommunityPool = await getcommunityPool();
    const dataProposals = await getProposals();
    const {
      linksCount,
      cidsCount,
      accountsCount,
      height,
      bandwidthPrice,
      bondedTokens,
      supplyTotal,
    } = statisticContainer;
    let inlfation = 0;
    let communityPool = 0;
    const activeValidatorsCount = validatorsStatistic;

    const chainId = status.node_info.network;

    const totalCyb = supplyTotal;
    const stakedCyb = bondedTokens / totalCyb;
    const linkPrice = (400 * +bandwidthPrice).toFixed(0);

    if (dataInlfation !== null) {
      inlfation = dataInlfation;
    }

    if (dataCommunityPool !== null) {
      communityPool = Math.floor(parseFloat(dataCommunityPool[0].amount));
    }

    this.setState({
      linksCount,
      cidsCount,
      proposals: dataProposals.length,
      accountsCount,
      totalCyb,
      communityPool,
      stakedCyb,
      activeValidatorsCount: activeValidatorsCount.length,
      chainId,
      inlfation,
    });
  };

  select = selected => {
    this.setState({ selected });
  };

  render() {
    const {
      linksCount,
      cidsCount,
      accountsCount,
      totalCyb,
      stakedCyb,
      activeValidatorsCount,
      addAddress,
      amount,
      loading,
      chainId,
      takeofPrice,
      capATOM,
      selected,
      communityPool,
      inlfation,
      cybernomics,
      proposals,
      gol,
      donation,
    } = this.state;
    const { block } = this.props;

    let content;

    if (loading) {
      return (
        <div
          style={{
            width: '100%',
            height: '50vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <Loading />
        </div>
      );
    }

    if (selected === 'main') {
      content = (
        <MainTab
          linksCount={parseInt(linksCount, 10)}
          cybernomics={cybernomics}
          activeValidatorsCount={activeValidatorsCount}
          donation={donation}
        />
      );
    }

    if (selected === 'knowledge') {
      content = (
        <Route
          path="/brain/knowledge"
          render={() => (
            <KnowledgeTab
              linksCount={parseInt(linksCount, 10)}
              cidsCount={parseInt(cidsCount, 10)}
              accountsCount={parseInt(accountsCount, 10)}
            />
          )}
        />
      );
    }

    if (selected === 'cybernomics') {
      content = (
        <Route
          path="/brain/cybernomics"
          render={() => <CybernomicsTab data={cybernomics} />}
        />
      );
    }

    if (selected === 'government') {
      content = (
        <Route
          path="/brain/government"
          render={() => (
            <GovernmentTab
              proposals={proposals}
              communityPool={communityPool}
              activeValidatorsCount={activeValidatorsCount}
              stakedCyb={stakedCyb}
              inlfation={inlfation}
            />
          )}
        />
      );
    }

    if (selected === 'community') {
      content = (
        <Route path="/brain/community" render={() => <CommunityTab />} />
      );
    }

    if (selected === 'apps') {
      content = <Route path="/brain/apps" render={() => <AppsTab />} />;
    }

    if (selected === 'help') {
      content = <Route path="/brain/help" render={() => <HelpTab />} />;
    }

    if (selected === 'path') {
      content = <Route path="/brain/path" render={() => <PathTab />} />;
    }

    return (
      <div>
        <main className="block-body">
          {amount === 0 && (
            <Pane
              boxShadow="0px 0px 5px #36d6ae"
              paddingX={20}
              paddingY={20}
              marginY={20}
            >
              <Text fontSize="16px" color="#fff">
                You do not have control over the brain. You need EUL tokens to
                let Her hear you. If you came from Ethereum or Cosmos you can{' '}
                <Link to="/gift">claim the gift</Link> of the Gods,{' '}
                <Link to="/gol/faucet">get with ETH</Link>
                on faucet or <Link to="/gol/takeoff">donate ATOM</Link> during
                takeoff. Then enjoy the greatest tournament in the universe:{' '}
                <Link to="/gol">Game of Links</Link>.
              </Text>
            </Pane>
          )}
          <Pane
            marginY={20}
            display="grid"
            gridTemplateColumns="max-content"
            justifyContent="center"
          >
            <Link to="/network/euler/block">
              <CardStatisics title={chainId} value={formatNumber(block)} />
            </Link>
          </Pane>

          <Tablist
            display="grid"
            gridTemplateColumns="repeat(auto-fit, minmax(110px, 1fr))"
            gridGap="10px"
            marginTop={25}
          >
            <TabBtn
              text="Knowledge"
              isSelected={selected === 'knowledge'}
              to="/brain/knowledge"
            />
            <TabBtn
              text="Path"
              isSelected={selected === 'path'}
              to="/brain/path"
            />
            <TabBtn
              text="Cybernomics"
              isSelected={selected === 'cybernomics'}
              to="/brain/cybernomics"
            />
            <TabBtn text="Main" isSelected={selected === 'main'} to="/brain" />
            <TabBtn
              text="Government"
              isSelected={selected === 'government'}
              to="/brain/government"
            />
            <TabBtn
              text="Apps"
              isSelected={selected === 'apps'}
              to="/brain/apps"
            />
            <TabBtn
              text="Help"
              isSelected={selected === 'help'}
              to="/brain/help"
            />
            <TabBtn
              text="Community"
              isSelected={selected === 'community'}
              to="/brain/community"
            />
          </Tablist>
          <Pane
            marginTop={50}
            marginBottom={50}
            display="grid"
            gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))"
            gridGap="20px"
          >
            {content}
          </Pane>
        </main>
        <ActionBarContainer
          addAddress={addAddress}
          updateFunc={this.checkAddressLocalStorage}
        />
      </div>
    );
  }
}

const mapStateToProps = store => {
  return {
    block: store.block.block,
  };
};

export default connect(mapStateToProps)(injectWeb3(Brain));
