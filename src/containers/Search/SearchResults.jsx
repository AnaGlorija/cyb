import React, { useState, useEffect } from 'react';
import { Pane, SearchItem, Text } from '@cybercongress/gravity';
import { useParams, useLocation, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { getIpfsHash, search, getRankGrade } from '../../utils/search/utils';
import { formatNumber, trimString } from '../../utils/utils';
import { Loading, Account, Copy, Tooltip, LinkWindow } from '../../components';
import ActionBarContainer from './ActionBarContainer';
import {
  PATTERN,
  PATTERN_CYBER,
  PATTERN_TX,
  PATTERN_CYBER_VALOPER,
  PATTERN_BLOCK,
  PATTERN_IPFS_HASH,
} from '../../utils/config';
import { setQuery } from '../../redux/actions/query';
import ContentItem from '../ipfs/contentItem';
import injectKeplr from '../../components/web3/injectKeplr';

const GradeTooltipContent = ({ grade, hash, color, rank }) => (
  <Pane paddingX={15} paddingY={15}>
    <Pane marginBottom={12}>
      <Text color="#ffff">
        Answer rank for{' '}
        {hash && (
          <Pane display="inline-flex" alignItems="center">
            {trimString(hash, 5, 5)} <Copy text={hash} />
          </Pane>
        )}{' '}
        is {rank}
      </Text>
    </Pane>
    <Pane display="flex" marginBottom={12}>
      <Text color="#ffff">
        Answers between &nbsp;
        {grade.from}
        &nbsp; and &nbsp;
        {grade.to}
        &nbsp; recieve grade
        <Pane
          className="rank"
          style={{ display: 'inline-flex' }}
          marginLeft="5px"
          backgroundColor={color}
        >
          {grade.value}
        </Pane>
      </Text>
    </Pane>
    <Pane>
      <Text color="#ffff">
        More about{' '}
        <LinkWindow to="https://ipfs.io/ipfs/QmceNpj6HfS81PcCaQXrFMQf7LR5FTLkdG9sbSRNy3UXoZ">
          cyber~Rank
        </LinkWindow>
      </Text>
    </Pane>
  </Pane>
);

const gradeColorRank = (rank) => {
  let rankGradeColor = '#546e7a';

  switch (rank) {
    case 1:
      rankGradeColor = '#ff3d00';
      break;
    case 2:
      rankGradeColor = '#ff9100';
      break;
    case 3:
      rankGradeColor = '#ffea00';
      break;
    case 4:
      rankGradeColor = '#64dd17';
      break;
    case 5:
      rankGradeColor = '#00b0ff';
      break;
    case 6:
      rankGradeColor = '#304ffe';
      break;
    case 7:
      rankGradeColor = '#d500f9';
      break;
    default:
      rankGradeColor = '#546e7a';
      break;
  }

  return rankGradeColor;
};

const Rank = ({ rank, grade, hash, tooltip, ...props }) => {
  const color = gradeColorRank(grade.value);
  return (
    <Tooltip
      placement="bottom"
      tooltip={
        <GradeTooltipContent
          grade={grade}
          hash={hash}
          color={color}
          rank={rank}
        />
      }
    >
      <Pane className="rank" backgroundColor={color} {...props}>
        {grade.value}
      </Pane>
    </Tooltip>
  );
};

function SearchResults({ node, mobile, keplr, setQueryProps }) {
  const { query } = useParams();
  const location = useLocation();
  const [searchResults, setSearchResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [keywordHash, setKeywordHash] = useState('');
  const [update, setUpdate] = useState(1);
  const [rankLink, setRankLink] = useState(null);

  useEffect(() => {
    const feachData = async () => {
      setLoading(true);
      setQueryProps(query);
      let keywordHashTemp = '';
      let keywordHashNull = '';
      let searchResultsData = [];
      if (query.match(PATTERN_IPFS_HASH)) {
        keywordHashTemp = query;
      } else {
        keywordHashTemp = await getIpfsHash(query.toLowerCase());
      }

      let responseSearchResults = await search(keywordHashTemp);
      if (responseSearchResults.length === 0) {
        const queryNull = '0';
        keywordHashNull = await getIpfsHash(queryNull);
        responseSearchResults = await search(keywordHashNull);
      }
      searchResultsData = responseSearchResults.reduce(
        (obj, item) => ({
          ...obj,
          [item.cid]: {
            cid: item.cid,
            rank: formatNumber(item.rank, 6),
            grade: getRankGrade(item.rank),
            status: node !== null ? 'understandingState' : 'impossibleLoad',
            query,
            text: item.cid,
            content: false,
          },
        }),
        {}
      );
      setKeywordHash(keywordHashTemp);
      setSearchResults(searchResultsData);
      setLoading(false);
    };
    feachData();
  }, [query, location, update]);

  useEffect(() => {
    setRankLink(null);
  }, [update]);

  const onClickRank = async (key) => {
    if (rankLink === key) {
      setRankLink(null);
    } else {
      setRankLink(key);
    }
  };

  const searchItems = [];

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
        <div style={{ color: '#fff', marginTop: 20, fontSize: 20 }}>
          Searching
        </div>
      </div>
    );
  }

  if (query.match(PATTERN)) {
    searchItems.push(
      <Pane
        position="relative"
        className="hover-rank"
        display="flex"
        alignItems="center"
        marginBottom="10px"
      >
        <Link className="SearchItem" to={`/gift/${query}`}>
          <SearchItem
            hash={`${query}_PATTERN`}
            text="Don't wait! Claim your gift, and join the Game of Links!"
            status="sparkApp"
            // address={query}
          />
        </Link>
      </Pane>
    );
  }

  if (query.match(PATTERN_CYBER)) {
    searchItems.push(
      <Pane
        position="relative"
        className="hover-rank"
        display="flex"
        alignItems="center"
        marginBottom="10px"
      >
        <Link className="SearchItem" to={`/network/euler/contract/${query}`}>
          <SearchItem
            hash={`${query}_PATTERN_CYBER`}
            text="Explore details of contract"
            contentApp={<Pane color="#000">{trimString(query, 8, 5)}</Pane>}
            status="sparkApp"
          />
        </Link>
      </Pane>
    );
  }

  if (query.match(PATTERN_CYBER_VALOPER)) {
    searchItems.push(
      <Pane
        position="relative"
        className="hover-rank"
        display="flex"
        alignItems="center"
        marginBottom="10px"
      >
        <Link className="SearchItem" to={`/network/euler/hero/${query}`}>
          <SearchItem
            hash={`${query}_PATTERN_CYBER_VALOPER`}
            text="Explore details of hero"
            contentApp={<Account colorText="#000" address={query} />}
            status="sparkApp"
          />
        </Link>
      </Pane>
    );
  }

  if (query.match(PATTERN_TX)) {
    searchItems.push(
      <Pane
        position="relative"
        className="hover-rank"
        display="flex"
        alignItems="center"
        marginBottom="10px"
      >
        <Link className="SearchItem" to={`/network/euler/tx/${query}`}>
          <SearchItem
            hash={`${query}_PATTERN_TX`}
            text="Explore details of tx "
            status="sparkApp"
            contentApp={<Pane color="#000">{trimString(query, 4, 4)}</Pane>}
          />
        </Link>
      </Pane>
    );
  }

  if (query.match(PATTERN_BLOCK)) {
    searchItems.push(
      <Pane
        position="relative"
        className="hover-rank"
        display="flex"
        alignItems="center"
        marginBottom="10px"
      >
        <Link className="SearchItem" to={`/network/euler/block/${query}`}>
          <SearchItem
            hash={`${query}_PATTERN_BLOCK`}
            text="Explore details of block "
            status="sparkApp"
            contentApp={
              <Pane color="#000">{formatNumber(parseFloat(query))}</Pane>
            }
          />
        </Link>
      </Pane>
    );
  }

  searchItems.push(
    Object.keys(searchResults).map((key) => {
      return (
        <Pane
          position="relative"
          className="hover-rank"
          display="flex"
          alignItems="center"
          marginBottom="10px"
        >
          {!mobile && (
            <Pane
              className={`time-discussion rank-contentItem ${
                rankLink === key ? '' : 'hover-rank-contentItem'
              }`}
              position="absolute"
            >
              <Rank
                hash={key}
                rank={searchResults[key].rank}
                grade={searchResults[key].grade}
                onClick={() => onClickRank(key)}
              />
            </Pane>
          )}
          <ContentItem
            nodeIpfs={node}
            cid={key}
            item={searchResults[key]}
            className="SearchItem"
          />
        </Pane>
      );
    })
  );

  return (
    <div>
      <main className="block-body" style={{ paddingTop: 30 }}>
        <Pane
          width="90%"
          marginX="auto"
          marginY={0}
          display="flex"
          flexDirection="column"
        >
          <div className="container-contentItem" style={{ width: '100%' }}>
            {searchItems}
          </div>
        </Pane>
      </main>

      {!mobile && (
        <ActionBarContainer
          keywordHash={keywordHash}
          update={() => setUpdate(update + 1)}
          keplr={keplr}
          rankLink={rankLink}
        />
      )}
    </div>
  );
}

const mapStateToProps = (store) => {
  return {
    node: store.ipfs.ipfs,
    mobile: store.settings.mobile,
  };
};

const mapDispatchprops = (dispatch) => {
  return {
    setQueryProps: (query) => dispatch(setQuery(query)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchprops
)(injectKeplr(SearchResults));
