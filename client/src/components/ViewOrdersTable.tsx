import '../App.css';

import React, { useState } from 'react';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { IOrder } from '../types';
import Paper from '@mui/material/Paper';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import ViewOrderModal from '../components/ViewOrderModal';

interface IViewOrdersTableProps {
  orders: IOrder[];
}

export default function ViewOrdersTable({ orders }: IViewOrdersTableProps) {
  const [order, setModalData] = useState<IOrder>();
  const [openViewOrder, setViewOrderOpen] = React.useState(false);

  const handleViewOrder = (order: IOrder) => {
    setModalData(order);
    setViewOrderOpen(true);
  };

  const handleViewOrderClose = () => {
    setViewOrderOpen(false);
  };

  return (
    <>
      <Container maxWidth="lg">
        <TableContainer
          data-test="view-order-table-container-container"
          component={Paper}
        >
          <Table
            sx={{ minWidth: 650 }}
            aria-label="simple table"
            data-test="view-order-table"
          >
            <TableHead>
              <TableRow data-test="main-table-row">
                <TableCell data-test="main-table-row-order-id">
                  Order ID
                </TableCell>
                <TableCell data-test="main-table-row-product-id" align="right">
                  Product ID
                </TableCell>
                <TableCell data-test="main-table-row-quantity" align="right">
                  Quantity
                </TableCell>
                <TableCell data-test="main-table-row-created" align="right">
                  Created
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody data-test="view-order-table-body">
              {orders.map((row) => (
                <TableRow
                  key={row.id}
                  data-test={'view-order-table-row-' + row.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Button
                      data-test={'view-order-button-' + row.id}
                      onClick={() => handleViewOrder(row)}
                      startIcon={<PlaylistAddCheckIcon />}
                      variant="outlined"
                      size="small"
                      color="primary"
                    >
                      {row.id.substring(0, 8)}
                    </Button>
                  </TableCell>
                  <TableCell align="right">{row.productId}</TableCell>
                  <TableCell align="right">{row.quantity}</TableCell>
                  <TableCell align="right">
                    {new Date(row.created).toLocaleString('en-GB')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
      <ViewOrderModal
        modalOpen={openViewOrder}
        order={order}
        handleViewOrderClose={handleViewOrderClose}
      />
    </>
  );
}
