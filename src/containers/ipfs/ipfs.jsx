import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Pane,
  SearchItem,
  Tablist,
  TableEv as Table,
  Rank,
  Text,
} from '@cybercongress/gravity';
import { connect } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import Iframe from 'react-iframe';
import { useQuery, useSubscription } from '@apollo/react-hooks';
import { ObjectInspector, chromeDark } from '@tableflip/react-inspector';
import gql from 'graphql-tag';
import { search, getRankGrade, getCreator } from '../../utils/search/utils';
import { Dots, TabBtn, Loading, TextTable, Cid } from '../../components';
import CodeBlock from './codeBlock';
import Noitem from '../account/noItem';
import { formatNumber, trimString, formatCurrency } from '../../utils/utils';
import { PATTERN_HTTP } from '../../utils/config';
import {
  DiscussionTab,
  CommunityTab,
  AnswersTab,
  ContentTab,
  OptimisationTab,
  MetaTab,
} from './tab';
import ActionBarContainer from '../Search/ActionBarContainer';
import AvatarIpfs from '../account/avatarIpfs';
import ContentItem from './contentItem';
import useGetIpfsContent from './useGetIpfsContentHook';

const dateFormat = require('dateformat');

const FileType = require('file-type');

const testData = {
  data: { type: 'Buffer', data: [8, 1] },
  links: [],
  cid: 'QmYPNmahJAvkMTU6tDx5zvhEkoLzEFeTDz6azDCSNqzKkW',
  size: 10016715,
};

const objectInspectorTheme = {
  ...chromeDark,
  BASE_FONT_SIZE: '13px',
  BASE_LINE_HEIGHT: '19px',
  TREENODE_FONT_SIZE: '13px',
  TREENODE_LINE_HEIGHT: '19px',
};

const GradeTooltipContent = ({ grade, color, rank }) => (
  <Pane paddingX={15} paddingY={15}>
    <Pane marginBottom={12}>
      <Text>Answer rank is {rank}</Text>
    </Pane>
    <Pane display="flex" marginBottom={12}>
      <Text>
        Answers between &nbsp;
        {grade.from}
        &nbsp; and &nbsp;
        {grade.to}
        &nbsp; recieve grade
        <Pill
          paddingX={8}
          paddingY={5}
          width={25}
          height={16}
          display="inline-flex"
          marginLeft={5}
          alignItems="center"
          style={{ color: '#fff', backgroundColor: color }}
          isSolid
        >
          {grade.value}
        </Pill>
      </Text>
    </Pane>
    <Pane>
      <Text>
        More about{' '}
        <Link
          textDecoration="none"
          href="https://ipfs.io/ipfs/QmceNpj6HfS81PcCaQXrFMQf7LR5FTLkdG9sbSRNy3UXoZ"
          color="green"
          cursor="pointer"
          target="_blank"
        >
          cyber~Rank
        </Link>
      </Text>
    </Pane>
  </Pane>
);

const Pill = ({ children, active, ...props }) => (
  <Pane
    display="flex"
    fontSize="14px"
    borderRadius="20px"
    height="20px"
    paddingY="5px"
    paddingX="8px"
    alignItems="center"
    lineHeight="1"
    justifyContent="center"
    backgroundColor={active ? '#000' : '#36d6ae'}
    color={active ? '#36d6ae' : '#000'}
    {...props}
  >
    {children}
  </Pane>
);

function Ipfs({ nodeIpfs, mobile }) {
  const { cid } = useParams();
  const location = useLocation();
  const dataGetIpfsContent = useGetIpfsContent(cid, nodeIpfs, 10);

  const GET_FROM_LINK = gql`
  query MyQuery {
      cyberlink(
        where: {
          object_to: { _eq: "${cid}" }
        },
        order_by: {timestamp: desc}
      ) {
        subject
        object_from
        object_to
        timestamp
      }
    }
  `;
  const GET_TO_LINK = gql`
  subscription MyQuery {
      cyberlink(
        where: {
          object_from: { _eq: "${cid}" }
        },
        order_by: {timestamp: desc}
      ) {
        subject
        object_from
        object_to
        timestamp
      }
    }
  `;

  const GET_LINK = gql`
  subscription MyQuery {
      cyberlink(where: {_or: [{object_to: {_eq: "${cid}"}}, {object_from: {_eq: "${cid}"}}]}, order_by: {timestamp: desc}) {
        subject
      }
    }
  `;

  const [content, setContent] = useState('');
  const [typeContent, setTypeContent] = useState('');
  const [communityData, setCommunityData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('discussion');
  const [selectedMeta, setSelectedMeta] = useState('size');
  const [gateway, setGateway] = useState(null);
  const [placeholder, setPlaceholder] = useState('');
  const [dataToLink, setDataToLink] = useState([]);
  const [creator, setCreator] = useState({
    address: '',
    timestamp: '',
  });

  const [metaData, setMetaData] = useState({
    type: 'file',
    size: 0,
    blockSizes: [],
    data: '',
  });
  const [textBtn, setTextBtn] = useState(false);
  const { data: dataFromLink, loading: loadingFromLink } = useSubscription(
    GET_FROM_LINK
  );
  const { data: dataQueryToLink } = useSubscription(GET_TO_LINK);
  const { data: dataQueryCommunity } = useSubscription(GET_LINK);

  let contentTab;

  console.log('dataGetIpfsContent :>> ', dataGetIpfsContent);

  useEffect(() => {
    setLoading(true);
    setContent(dataGetIpfsContent.content);
    setTypeContent(dataGetIpfsContent.typeContent);
    setGateway(dataGetIpfsContent.gateway);
    setLoading(dataGetIpfsContent.loading);
    setMetaData(dataGetIpfsContent.metaData);
  }, [dataGetIpfsContent]);

  useEffect(() => {
    feacDataSearch();
  }, [cid]);

  const feacDataSearch = async () => {
    const responseSearch = await search(cid);
    setDataToLink(responseSearch);
  };

  useEffect(() => {
    const feacData = async () => {
      const responseCreator = await getCreator(cid);
      console.log('responseCreator :>> ', responseCreator);
      if (
        responseCreator !== null &&
        responseCreator.txs &&
        responseCreator.txs.length > 0
      ) {
        const addressCreator =
          responseCreator.txs[0].tx.value.msg[0].value.address;
        const timeCreate = responseCreator.txs[0].timestamp;
        setCreator({
          address: addressCreator,
          timestamp: timeCreate,
        });
      }
    };
    feacData();
  }, [cid]);

  useEffect(() => {
    let dataTemp = {};
    if (dataQueryCommunity && dataQueryCommunity.cyberlink.length > 0) {
      dataQueryCommunity.cyberlink.forEach(item => {
        if (dataTemp[item.subject]) {
          dataTemp[item.subject].amount += 1;
        } else {
          dataTemp = {
            ...dataTemp,
            [item.subject]: {
              amount: 1,
            },
          };
        }
      });
      setCommunityData(dataTemp);
    }
  }, [dataQueryCommunity]);

  useEffect(() => {
    chekPathname();
  }, [location.pathname]);

  const chekPathname = () => {
    const { pathname } = location;

    if (
      pathname.match(/baclinks/gm) &&
      pathname.match(/baclinks/gm).length > 0
    ) {
      setSelectedMeta('baclinks');
      setSelected('meta');
    } else if (
      pathname.match(/community/gm) &&
      pathname.match(/community/gm).length > 0
    ) {
      setSelectedMeta('community');
      setSelected('meta');
    } else if (
      pathname.match(/answers/gm) &&
      pathname.match(/answers/gm).length > 0
    ) {
      setTextBtn('add answer');
      setPlaceholder('add keywords, hash or file');
      setSelected('answers');
    } else if (
      pathname.match(/meta/gm) &&
      pathname.match(/meta/gm).length > 0
    ) {
      setSelected('meta');
      setSelectedMeta('size');
    } else {
      setPlaceholder('add message');
      setTextBtn('Comment');
      setSelected('discussion');
    }
  };

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

  if (selected === 'answers') {
    contentTab = (
      <AnswersTab data={dataToLink} mobile={mobile} nodeIpfs={nodeIpfs} />
    );
  }

  if (selected === 'discussion') {
    contentTab = (
      <DiscussionTab
        data={dataQueryToLink}
        mobile={mobile}
        nodeIpfs={nodeIpfs}
      />
    );
  }

  // if (selected === 'content') {
  //   contentTab = (
  //     <ContentTab
  //       typeContent={typeContent}
  //       gateway={gateway}
  //       content={content}
  //       cid={cid}
  //     />
  //   );
  // }

  if (selected === 'meta') {
    contentTab = (
      <>
        <Pane width="60%" marginX="auto" marginTop="25px" fontSize="18px">
          Creator
        </Pane>
        <Pane
          alignItems="center"
          width="60%"
          marginX="auto"
          justifyContent="center"
          display="flex"
          flexDirection="column"
        >
          <Link to={`/network/euler/contract/${creator.address}`}>
            <Pane
              alignItems="center"
              marginX="auto"
              justifyContent="center"
              display="flex"
            >
              {creator.address.length > 11 && (
                <Pane> {creator.address.slice(0, 7)}</Pane>
              )}
              <AvatarIpfs node={nodeIpfs} addressCyber={creator.address} />
              {creator.address.length > 11 && (
                <Pane> {creator.address.slice(-6)}</Pane>
              )}
            </Pane>
          </Link>
          {creator.timestamp.length > 0 && (
            <Pane>{dateFormat(creator.timestamp, 'dd/mm/yyyy, HH:MM:ss')}</Pane>
          )}
        </Pane>
        <CommunityTab node={nodeIpfs} data={communityData} />
        <Pane width="60%" marginX="auto" marginBottom="15px" fontSize="18px">
          Backlinks
        </Pane>
        <OptimisationTab
          data={dataFromLink}
          mobile={mobile}
          nodeIpfs={nodeIpfs}
        />
        <Pane width="60%" marginX="auto" fontSize="18px">
          Meta
        </Pane>
        <MetaTab cid={cid} data={metaData} />
      </>
    );
  }

  return (
    <>
      <main
        className="block-body"
        style={{
          minHeight: 'calc(100vh - 70px)',
          paddingBottom: '5px',
          height: '1px',
          width: '100%',
        }}
      >
        <ContentTab
          typeContent={typeContent}
          gateway={gateway}
          content={content}
          cid={cid}
        />
        <Tablist
          display="grid"
          gridTemplateColumns="repeat(auto-fit, minmax(110px, 1fr))"
          gridGap="10px"
          marginTop={25}
          marginBottom={selected !== 'meta' ? 25 : 0}
          width="62%"
          marginX="auto"
        >
          {/* <TabBtn
          text="content"
          isSelected={selected === 'content'}
          to={`/ipfs/${cid}`}
        /> */}
          <TabBtn
            // text="answers"
            text={
              <Pane display="flex" alignItems="center">
                <Pane>answers</Pane>
                {dataToLink.length > 0 && (
                  <Pill marginLeft={5} active={selected === 'answers'}>
                    {formatNumber(dataToLink.length)}
                  </Pill>
                )}
              </Pane>
            }
            isSelected={selected === 'answers'}
            to={`/ipfs/${cid}/answers`}
          />
          <TabBtn
            // text="discussion"
            text={
              <Pane display="flex" alignItems="center">
                <Pane>discussion</Pane>
                {dataQueryToLink && dataQueryToLink.cyberlink.length > 0 && (
                  <Pill marginLeft={5} active={selected === 'discussion'}>
                    {formatNumber(dataQueryToLink.cyberlink.length)}
                  </Pill>
                )}
              </Pane>
            }
            isSelected={selected === 'discussion'}
            to={`/ipfs/${cid}`}
          />
          <TabBtn
            text="meta"
            isSelected={selected === 'meta'}
            to={`/ipfs/${cid}/meta`}
          />
        </Tablist>
        {contentTab}
      </main>
      {!mobile && (selected === 'discussion' || selected === 'answers') && (
        <ActionBarContainer
          placeholder={placeholder}
          textBtn={textBtn}
          keywordHash={cid}
          update={() => feacDataSearch()}
        />
      )}
    </>
  );
}

const mapStateToProps = store => {
  return {
    nodeIpfs: store.ipfs.ipfs,
    mobile: store.settings.mobile,
  };
};

export default connect(mapStateToProps)(Ipfs);
