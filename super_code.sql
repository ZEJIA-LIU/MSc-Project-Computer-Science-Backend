-- phpMyAdmin SQL Dump
-- version 4.5.4.1deb2ubuntu2.1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: 2020-04-04 16:06:43
-- 服务器版本： 5.7.29-0ubuntu0.16.04.1
-- PHP Version: 7.0.33-0ubuntu0.16.04.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `super_code`
--

-- --------------------------------------------------------

--
-- 表的结构 `inactive_user`
--

CREATE TABLE `inactive_user` (
  `email` varchar(30) NOT NULL,
  `code` varchar(10) NOT NULL,
  `expire_time` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- 转存表中的数据 `inactive_user`
--

INSERT INTO `inactive_user` (`email`, `code`, `expire_time`) VALUES
('123@qq.com', '123456', '1584555261648'),
('124@qq.com', '654321', '1584555261300'),
('22222', '271796', '1584638940768'),
('3323@qq.com', '916813', '1584556718035'),
('3329@qq.com', '857426', '1584599536237'),
('3434', '467976', '1584638786034'),
('419084766@qq.com', '201654', '1584642999997');

-- --------------------------------------------------------

--
-- 表的结构 `user`
--

CREATE TABLE `user` (
  `user_id` varchar(10) NOT NULL,
  `nickname` varchar(10) NOT NULL,
  `sex` int(1) DEFAULT NULL,
  `password` varchar(50) NOT NULL,
  `email` varchar(30) NOT NULL,
  `phone` varchar(11) DEFAULT NULL,
  `avatar` varchar(20) NOT NULL DEFAULT 'user.jpg',
  `introduce` varchar(50) CHARACTER SET utf8 DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- 转存表中的数据 `user`
--

INSERT INTO `user` (`user_id`, `nickname`, `sex`, `password`, `email`, `phone`, `avatar`, `introduce`) VALUES
('abcdefg', 'blink', 0, 'e10adc3949ba59abbe56e057f20f883e', '123@qq.com', '3323', 'tUqPa09OxW.png', '123123'),
('df2sfsI', 'Rose', 1, 'e10adc3949ba59abbe56e057f20f883e', '124@qq.com', NULL, 'user.jpg', NULL),
('n5B8cvM', 'Superlin', 0, 'fcea920f7412b5da7be0cf42b8c93759', '419084766@qq.com', NULL, '9B0i4yLwuw.png', '啦啦啦啦');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `inactive_user`
--
ALTER TABLE `inactive_user`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `user_name` (`nickname`),
  ADD UNIQUE KEY `phone` (`phone`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
