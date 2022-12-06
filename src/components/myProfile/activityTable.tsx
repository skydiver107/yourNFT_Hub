import * as React from "react";

import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import Paper from "@mui/material/Paper";
import { Avatar, Button, IconButton, SvgIcon, Typography, Box } from "@mui/material";
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';

import Linkm from "@mui/material/Link";

import Link from "next/link";
import { useSelector } from "react-redux";
import { dropsListSelector, dropsPaginationSelector } from "src/common/selectors";
import { MARKETPLACES_API, ACTIVITY_TYPE } from "src/common/config";
import commonService from "src/common/services/common.service";
import Image from "next/image";

import { ExportToCsv } from 'export-to-csv';

/**
 * Link to web3.0
 * Import Web3.0 modules for solana
*/
import * as anchor from '@project-serum/anchor';
import { AccountLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { signAndSendTransaction } from 'src/common/helpers/sol/connection'
import {
  Keypair,
  Commitment,
  Connection,
  RpcResponseAndContext,
  SignatureStatus,
  SimulatedTransactionResponse,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
  Blockhash,
  FeeCalculator,
} from '@solana/web3.js';
import {
  WalletMultiButton,
  WalletConnectButton,
  WalletModal,
  WalletModalButton,
  WalletModalProvider,
  WalletDisconnectButton,
  WalletIcon
} from '@solana/wallet-adapter-react-ui';

import DiscordIcon from "public/images/discord.svg";
import LinkIcon from "public/images/link.svg";
import TwitterIcon from "public/images/twitter.svg";
import StyleTable from "./styles/styledTable";
import moment from "moment";

import TextLogo from "src/theme/textLogo";
import ButtonWhite from "src/theme/buttonWhite";
import { handleImageError } from "src/common/utils/handleImageError";
import shortAddress from "src/common/utils/shortAddress";
import getCollectionName from "src/common/utils/getCollectionName";
import getCryptoSvg from "src/common/utils/getCryptoSvg";
import { Fragment } from "react";
import { getSlug } from "../../helper/generateSlug";

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (
    event: React.MouseEvent<HTMLButtonElement>,
    newPage: number,
  ) => void;
}

function TablePaginationActions(props: TablePaginationActionsProps) {
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        sx={{
          color: `white`
        }}
        disabled={page === 0}
        aria-label="first page"
        size={`large`}
      >
        <FirstPageIcon fontSize={`large`} />
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        sx={{
          color: `white`
        }}
        aria-label="previous page"
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        sx={{
          color: `white`
        }}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        sx={{
          color: `white`
        }}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton>
    </Box>
  );
}

const csvOption = {
  fieldSeparator: ',',
  quoteStrings: '"',
  decimalSeparator: '.',
  showLabels: true,
  showTitle: true,
  title: 'My Activity CSV',
  useTextFile: false,
  useBom: true,
  useKeysAsHeaders: true,
  // headers: ['Column 1', 'Column 2', etc...] <-- Won't work with useKeysAsHeaders present!
};

export default function ActivityTable(props) {

  const [data, setData] = React.useState([]);
  const { csv } = props;

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;

  const csvExporter = new ExportToCsv(csvOption);

  //const loading = useSelector(dropsLoadingSelector);
  const [loading, setLoading] = React.useState<boolean>(false);

  const anchorWallet = useAnchorWallet();
  const wallet = useWallet();
  const { connection } = useConnection();

  React.useEffect(() => {
    (async () => {

      if (anchorWallet) {
        setLoading(true);
        let result: any;
        result = await commonService({
          method: "get",
          route: `${MARKETPLACES_API.GET_ACTIVITY_WALLET}?walletAddress=${anchorWallet.publicKey.toBase58()}&offset=0`
        });
        console.log(`result`, result);
        setData([...result.rows]);
        setLoading(false);
      }

    })()
  }, [anchorWallet]);

  React.useEffect(() => {
    (async () => {
      if (data.length > 0) {
        csvExporter.generateCsv(data);
      }
    })()
  }, [csv]);

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number,
  ) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TableContainer component={"div"} sx={{ pb: 5, width: `96%`, marginLeft: `auto`, marginRight: `auto` }}>
      <StyleTable aria-label='Drops List'>
        <TableHead>
          <TableRow
            sx={{
              "& th": { color: "text.secondary", fontSize: "10" },
              "& td": {
                fontSize: theme => theme.typography.h5.fontSize,
                color: "text.secondary",
              },
              "&:hover": {
                boxShadow: `none !important`
              }
            }}>
            <TableCell align='left' variant='head'>
              NFT
            </TableCell>
            <TableCell align='left' variant='head'>
              Transaction ID
            </TableCell>
            <TableCell align='left' variant='head'>
              Type
            </TableCell>
            <TableCell align='left' variant='head'>
              Price
            </TableCell>
            <TableCell align='left' variant='head'>
              From
            </TableCell>
            <TableCell align='left' variant='head'>
              To
            </TableCell>
            <TableCell align='left' variant='head'>
              Placed
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            (rowsPerPage > 0
              ? data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : data).map((item, index) => {
                return (
                  <TableRow
                    key={index}
                    sx={{
                      // "&:last-child td, &:last-child th": { border: 0 },
                      "& td": {
                        color: "text.secondary",
                        fontSize: theme => theme.typography.h5.fontSize,
                      },
                    }}>
                    <TableCell align='left' component='td' className='trstart'>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ position: "relative" }}>
                          <Avatar
                            alt='Remy Sharp'
                            sx={{ width: 80, height: 80, border: 2 }}
                          >
                            <Box component={`img`} src={item.image} alt='fallback image' onError={handleImageError} />
                          </Avatar>
                        </Box>
                        <Link
                          href={`/item-details/${item.mintAddress} `}
                          passHref>
                          <Linkm href='`/item-details/${item.mintAddress} `'>
                            <Typography variant='h5' textAlign='center' color='text.primary' pl={3}>
                              {item.name}
                            </Typography>
                          </Linkm>
                        </Link>
                      </Box>
                    </TableCell>
                    <TableCell align='left'>
                      <Link href={`https://solscan.io/tx/${item?.signature}`} passHref>
                        <a target="_blank">
                          {shortAddress(`${item?.signature}`)}
                        </a>
                      </Link>
                    </TableCell>
                    <TableCell align='left' sx={{ color: `${ACTIVITY_TYPE[item.type].color} !important` }}>
                      {ACTIVITY_TYPE[item.type].text}
                    </TableCell>
                    <TableCell align='left'>
                      <><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M3.38709 2.79756C3.47299 2.7151 3.58638 2.66699 3.7032 2.66699H14.6093C14.8086 2.66699 14.9083 2.90752 14.7674 3.0484L12.613 5.20282C12.5305 5.28528 12.4171 5.33339 12.2968 5.33339H1.39072C1.19143 5.33339 1.09179 5.09286 1.23267 4.95198L3.38709 2.79756ZM3.38709 10.8414C3.46955 10.759 3.58294 10.7108 3.7032 10.7108H14.6093C14.8086 10.7108 14.9083 10.9514 14.7674 11.0923L12.613 13.2467C12.5305 13.3291 12.4171 13.3772 12.2968 13.3772H1.39072C1.19143 13.3772 1.09179 13.1367 1.23267 12.9958L3.38709 10.8414ZM12.2968 6.66315C12.4171 6.66315 12.5305 6.71125 12.613 6.79372L14.7674 8.94814C14.9083 9.08902 14.8086 9.32954 14.6093 9.32954H3.7032C3.58294 9.32954 3.46955 9.28144 3.38709 9.19897L1.23267 7.04455C1.09179 6.90367 1.19143 6.66315 1.39072 6.66315H12.2968Z" fill="white" />
                      </svg>
                        &nbsp;
                        {item.price}

                      </>
                    </TableCell>
                    <TableCell align='left'>
                      <Link href={`https://solscan.io/account/${item?.from}`} passHref>
                        <a target="_blank">
                          {shortAddress(`${item?.from}`)}
                        </a>
                      </Link>
                    </TableCell>
                    <TableCell align='left'>
                      <Link href={`https://solscan.io/account/${item?.to}`} passHref>
                        <a target="_blank">
                          {shortAddress(`${item?.to}`)}
                        </a>
                      </Link>
                    </TableCell>
                    <TableCell align='left' className='trend' sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant={`inherit`} color="text.primary">
                        {moment(item.updated_at).startOf('minute').fromNow()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TablePagination
              rowsPerPageOptions={[10, 20, 50, { label: 'All', value: -1 }]}
              colSpan={6}
              count={data.length}
              rowsPerPage={rowsPerPage}
              page={page}
              SelectProps={{
                inputProps: {
                  'aria-label': 'rows per page',
                },
                native: false,
              }}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              ActionsComponent={TablePaginationActions}
              sx={{
                fontSize: theme => `${theme.typography.h6.fontSize} !important`,
                '& *': {
                  fontSize: theme => `${theme.typography.h6.fontSize} !important`
                }
              }}
            />
          </TableRow>
        </TableFooter>
      </StyleTable>
      {
        loading && (
          <Backdrop
            sx={{ color: "Grey", zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={true}
          >
            <CircularProgress color="inherit" sx={{
              width: `80px`,
              height: `80px`
            }} />
            &nbsp; Loading...
          </Backdrop>
        )
      }
    </TableContainer >
  );
}