package br.com.stockflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class StockFlowApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockFlowApplication.class, args);
    }
}
