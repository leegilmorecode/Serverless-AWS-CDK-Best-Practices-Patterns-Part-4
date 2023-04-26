import '../App.css';

import { IOrder, Stores } from '../types';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import Container from '@mui/material/Container';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Modal from '@mui/material/Modal';
import Paper from '@mui/material/Paper';
import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  maxWidth: '80%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface IViewOrderModalProps {
  modalOpen: boolean;
  order: IOrder | undefined;
  handleViewOrderClose: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function ViewOrderModal({
  modalOpen,
  order,
  handleViewOrderClose,
}: IViewOrderModalProps) {
  return (
    <Modal
      data-test="view-order-modal"
      open={modalOpen}
      title="Order"
      onClose={handleViewOrderClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Container maxWidth="lg">
          <DialogTitle id="id">
            <Box display="flex" alignItems="center">
              <Box flexGrow={1}>Order Item</Box>
              <Box>
                <IconButton
                  data-test="close-modal-button"
                  onClick={handleViewOrderClose}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          </DialogTitle>
          <TableContainer component={Paper}>
            <Table data-test="modal-table" aria-label="modal table">
              <TableHead>
                <TableRow>
                  <TableCell align="left">Order ID</TableCell>
                  <TableCell align="right">Product ID</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow
                  key={order?.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {order?.id}
                  </TableCell>
                  <TableCell align="right">{order?.productId}</TableCell>
                  <TableCell align="right">{order?.quantity}</TableCell>
                </TableRow>
              </TableBody>
              <TableHead>
                <TableRow>
                  <TableCell align="left">Created</TableCell>
                  <TableCell align="right">Store ID</TableCell>
                  <TableCell align="right">Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow
                  key={order?.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell align="left">
                    {order?.created
                      ? new Date(order?.created).toLocaleString('en-GB')
                      : 'No Date'}
                  </TableCell>
                  <TableCell align="right">
                    {order?.storeId
                      ? Object.keys(Stores).find(
                          (key: string) => Stores[key] === order.storeId
                        )
                      : 'Unknown'}
                  </TableCell>
                  <TableCell align="right">{order?.type}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box
            sx={{ marginTop: '20px' }}
            justifyContent="space-between"
            display="flex"
          >
            <Button
              data-test="close-view-order-button"
              startIcon={<CancelIcon />}
              variant="outlined"
              size="small"
              color="secondary"
              onClick={handleViewOrderClose}
            >
              Close
            </Button>
          </Box>
        </Container>
      </Box>
    </Modal>
  );
}
